"""Analytics engine — computes metrics, rankings and insights."""

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from statistics import mean, stdev

from app.models.atleta import Atleta
from app.models.scout import ScoutRodada
from app.models.clube import Clube
from app.models.posicao import Posicao
from app.schemas.analytics import (
    AtletaAnalyticsResponse,
    ClubeAnalyticsResponse,
    ScoutMedio,
    TendenciaPreco,
)

logger = structlog.get_logger()


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ──────────────────────────────────────────────
    # Athlete Analytics
    # ──────────────────────────────────────────────

    async def get_atleta_analytics(self, atleta_id: int) -> AtletaAnalyticsResponse:
        # Fetch atleta
        atleta = await self.db.get(Atleta, atleta_id)
        if not atleta:
            raise ValueError(f"Atleta {atleta_id} não encontrado")

        clube = await self.db.get(Clube, atleta.clube_id)
        posicao = await self.db.get(Posicao, atleta.posicao_id)

        # Fetch all scout history
        result = await self.db.execute(
            select(ScoutRodada)
            .where(ScoutRodada.atleta_id == atleta_id)
            .order_by(ScoutRodada.rodada_id)
        )
        scouts = result.scalars().all()

        # Calculate metrics
        pontos_list = [s.pontos_num for s in scouts if s.entrou_em_campo]
        jogos_count = len(pontos_list) or 1

        media_pontos = mean(pontos_list) if pontos_list else 0.0
        dp = stdev(pontos_list) if len(pontos_list) > 1 else 0.0
        maior = max(pontos_list) if pontos_list else 0.0
        menor = min(pontos_list) if pontos_list else 0.0
        regularidade = (
            len([p for p in pontos_list if p >= media_pontos]) / jogos_count * 100
            if pontos_list
            else 0.0
        )

        # Scout médio
        scout_medio = ScoutMedio(
            gols_por_jogo=sum(s.gols for s in scouts) / jogos_count,
            assistencias_por_jogo=sum(s.assistencias for s in scouts) / jogos_count,
            desarmes_por_jogo=sum(s.desarmes for s in scouts) / jogos_count,
            faltas_por_jogo=sum(s.faltas_cometidas for s in scouts) / jogos_count,
            finalizacoes_por_jogo=sum(
                s.finalizacao_trave + s.finalizacao_defendida + s.finalizacao_fora
                for s in scouts
            )
            / jogos_count,
            cartoes_por_jogo=sum(
                s.cartao_amarelo + s.cartao_vermelho for s in scouts
            )
            / jogos_count,
        )

        # Tendência preço
        precos = [s.preco_num for s in scouts]
        var_total = precos[-1] - precos[0] if len(precos) > 1 else 0.0
        var_media = mean([s.variacao_num for s in scouts]) if scouts else 0.0

        if var_total > 0.5:
            tendencia_str = "subindo"
        elif var_total < -0.5:
            tendencia_str = "descendo"
        else:
            tendencia_str = "estavel"

        tendencia = TendenciaPreco(
            variacao_total=round(var_total, 2),
            variacao_media=round(var_media, 2),
            tendencia=tendencia_str,
        )

        # Custo-benefício
        ppc = (
            round(media_pontos / atleta.preco_num, 2) if atleta.preco_num > 0 else 0.0
        )

        # Últimos 5
        ultimos_5 = pontos_list[-5:] if pontos_list else []

        return AtletaAnalyticsResponse(
            atleta_id=atleta.id,
            apelido=atleta.apelido,
            clube_nome=clube.nome_fantasia if clube else "",
            posicao=posicao.nome if posicao else "",
            foto=atleta.foto,
            media_pontos=round(media_pontos, 2),
            desvio_padrao=round(dp, 2),
            maior_pontuacao=round(maior, 2),
            menor_pontuacao=round(menor, 2),
            regularidade=round(regularidade, 2),
            aproveitamento_pontos=0.0,
            scout_medio=scout_medio,
            tendencia_preco=tendencia,
            pontos_por_cartoleta=ppc,
            ultimos_5_pontos=ultimos_5,
            projecao_proxima_rodada=round(media_pontos, 2),
        )

    # ──────────────────────────────────────────────
    # Club Analytics
    # ──────────────────────────────────────────────

    async def get_clube_analytics(self, clube_id: int) -> ClubeAnalyticsResponse:
        clube = await self.db.get(Clube, clube_id)
        if not clube:
            raise ValueError(f"Clube {clube_id} não encontrado")

        # Aggregate scouts for the club
        result = await self.db.execute(
            select(ScoutRodada).where(ScoutRodada.clube_id == clube_id)
        )
        scouts = result.scalars().all()

        total_gols = sum(s.gols for s in scouts)
        total_assists = sum(s.assistencias for s in scouts)
        total_desarmes = sum(s.desarmes for s in scouts)
        total_gs = sum(s.gols_sofridos for s in scouts)
        total_sg = sum(s.saldo_gol for s in scouts)

        # Atletas do clube
        result = await self.db.execute(
            select(Atleta).where(Atleta.clube_id == clube_id)
        )
        atletas = result.scalars().all()
        media_pontos_time = (
            mean([a.media_num for a in atletas if a.jogos_num > 0]) if atletas else 0.0
        )

        # Best players
        atletas_com_jogos = [a for a in atletas if a.jogos_num > 0]
        melhor_media = None
        if atletas_com_jogos:
            best = max(atletas_com_jogos, key=lambda a: a.media_num)
            melhor_media = {"apelido": best.apelido, "media": best.media_num}

        return ClubeAnalyticsResponse(
            clube_id=clube.id,
            clube_nome=clube.nome_fantasia,
            escudo=clube.escudo_60,
            media_pontos_time=round(media_pontos_time, 2),
            total_gols=total_gols,
            total_assistencias=total_assists,
            total_desarmes=total_desarmes,
            total_gols_sofridos=total_gs,
            total_saldo_gol=total_sg,
            melhor_media=melhor_media,
        )

    # ──────────────────────────────────────────────
    # Rankings
    # ──────────────────────────────────────────────

    async def get_top_pontuadores(self, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(Atleta)
            .where(Atleta.jogos_num > 0)
            .order_by(desc(Atleta.media_num))
            .limit(limit)
        )
        atletas = result.scalars().all()

        rankings = []
        for a in atletas:
            clube = await self.db.get(Clube, a.clube_id)
            posicao = await self.db.get(Posicao, a.posicao_id)
            rankings.append(
                {
                    "atleta_id": a.id,
                    "apelido": a.apelido,
                    "foto": a.foto,
                    "clube_nome": clube.nome_fantasia if clube else "",
                    "clube_escudo": clube.escudo_30 if clube else "",
                    "posicao": posicao.abreviacao if posicao else "",
                    "media": a.media_num,
                    "preco": a.preco_num,
                    "jogos": a.jogos_num,
                    "pontos": a.pontos_num,
                    "variacao": a.variacao_num,
                    "pontos_por_cartoleta": round(
                        a.media_num / a.preco_num if a.preco_num > 0 else 0, 2
                    ),
                }
            )
        return rankings

    async def get_top_valorizacoes(self, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(Atleta)
            .where(Atleta.jogos_num > 0)
            .order_by(desc(Atleta.variacao_num))
            .limit(limit)
        )
        atletas = result.scalars().all()

        rankings = []
        for a in atletas:
            clube = await self.db.get(Clube, a.clube_id)
            rankings.append(
                {
                    "atleta_id": a.id,
                    "apelido": a.apelido,
                    "foto": a.foto,
                    "clube_nome": clube.nome_fantasia if clube else "",
                    "clube_escudo": clube.escudo_30 if clube else "",
                    "media": a.media_num,
                    "preco": a.preco_num,
                    "variacao": a.variacao_num,
                }
            )
        return rankings

    async def get_custo_beneficio(self, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(Atleta).where(Atleta.jogos_num > 0, Atleta.preco_num > 0)
        )
        atletas = result.scalars().all()

        scored = []
        for a in atletas:
            ppc = a.media_num / a.preco_num if a.preco_num > 0 else 0
            clube = await self.db.get(Clube, a.clube_id)
            posicao = await self.db.get(Posicao, a.posicao_id)
            scored.append(
                {
                    "atleta_id": a.id,
                    "apelido": a.apelido,
                    "foto": a.foto,
                    "clube_nome": clube.nome_fantasia if clube else "",
                    "clube_escudo": clube.escudo_30 if clube else "",
                    "posicao": posicao.abreviacao if posicao else "",
                    "media": a.media_num,
                    "preco": a.preco_num,
                    "pontos_por_cartoleta": round(ppc, 2),
                }
            )

        scored.sort(key=lambda x: x["pontos_por_cartoleta"], reverse=True)
        return scored[:limit]
