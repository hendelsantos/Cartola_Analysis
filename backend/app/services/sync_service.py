"""Service for syncing data from Cartola API to the database."""

import structlog
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import select

from app.models.clube import Clube
from app.models.atleta import Atleta
from app.models.rodada import Rodada
from app.models.partida import Partida
from app.models.posicao import Posicao
from app.models.scout import ScoutRodada
from app.models.mercado import MercadoStatus
from app.services.cartola_api import CartolaAPIClient

logger = structlog.get_logger()

# Scout key mapping from API -> model field
SCOUT_MAP = {
    "G": "gols",
    "A": "assistencias",
    "FT": "finalizacao_trave",
    "FD": "finalizacao_defendida",
    "FF": "finalizacao_fora",
    "FS": "faltas_sofridas",
    "FC": "faltas_cometidas",
    "CA": "cartao_amarelo",
    "CV": "cartao_vermelho",
    "I": "impedimentos",
    "DS": "desarmes",
    "DE": "defesas",
    "GS": "gols_sofridos",
    "SG": "saldo_gol",
    "DP": "defesa_penalti",
    "GC": "gol_contra",
    "PC": "penalti_cometido",
    "PS": "penalti_sofrido",
    "V": "vitoria",
    "PE": "passes_errados",
}


class SyncService:
    def __init__(self, db: AsyncSession, api_client: CartolaAPIClient):
        self.db = db
        self.api = api_client

    async def sync_all(self) -> dict:
        """Run full sync of all entities."""
        results = {}
        results["posicoes"] = await self.sync_posicoes()
        results["clubes"] = await self.sync_clubes()
        results["rodadas"] = await self.sync_rodadas()
        results["atletas"] = await self.sync_atletas()
        results["partidas"] = await self.sync_partidas()
        results["mercado"] = await self.sync_mercado_status()
        logger.info("full_sync_completed", results=results)
        return results

    async def sync_posicoes(self) -> int:
        data = await self.api.get_posicoes()
        count = 0
        for pos_id, pos_data in data.items():
            stmt = pg_insert(Posicao).values(
                id=pos_data["id"],
                nome=pos_data["nome"],
                abreviacao=pos_data["abreviacao"],
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={"nome": pos_data["nome"], "abreviacao": pos_data["abreviacao"]},
            )
            await self.db.execute(stmt)
            count += 1
        await self.db.commit()
        logger.info("sync_posicoes_completed", count=count)
        return count

    async def sync_clubes(self) -> int:
        data = await self.api.get_clubes()
        count = 0
        for club_id, club_data in data.items():
            escudos = club_data.get("escudos", {})
            stmt = pg_insert(Clube).values(
                id=club_data["id"],
                nome=club_data["nome"],
                abreviacao=club_data["abreviacao"],
                slug=club_data.get("slug", ""),
                apelido=club_data.get("apelido", ""),
                nome_fantasia=club_data.get("nome_fantasia", ""),
                escudo_60=escudos.get("60x60"),
                escudo_45=escudos.get("45x45"),
                escudo_30=escudos.get("30x30"),
                url_editoria=club_data.get("url_editoria"),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "nome": club_data["nome"],
                    "abreviacao": club_data["abreviacao"],
                    "slug": club_data.get("slug", ""),
                    "apelido": club_data.get("apelido", ""),
                    "nome_fantasia": club_data.get("nome_fantasia", ""),
                    "escudo_60": escudos.get("60x60"),
                    "escudo_45": escudos.get("45x45"),
                    "escudo_30": escudos.get("30x30"),
                    "url_editoria": club_data.get("url_editoria"),
                },
            )
            await self.db.execute(stmt)
            count += 1
        await self.db.commit()
        logger.info("sync_clubes_completed", count=count)
        return count

    async def sync_rodadas(self) -> int:
        data = await self.api.get_rodadas()
        count = 0
        for rod_data in data:
            stmt = pg_insert(Rodada).values(
                id=rod_data["rodada_id"],
                nome=rod_data["nome_rodada"],
                inicio=datetime.fromisoformat(rod_data["inicio"]),
                fim=datetime.fromisoformat(rod_data["fim"]),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "nome": rod_data["nome_rodada"],
                    "inicio": datetime.fromisoformat(rod_data["inicio"]),
                    "fim": datetime.fromisoformat(rod_data["fim"]),
                },
            )
            await self.db.execute(stmt)
            count += 1
        await self.db.commit()
        logger.info("sync_rodadas_completed", count=count)
        return count

    async def sync_atletas(self) -> int:
        data = await self.api.get_atletas_mercado()
        atletas = data if isinstance(data, list) else data.get("atletas", [])
        count = 0

        for atl in atletas:
            # Upsert atleta
            stmt = pg_insert(Atleta).values(
                id=atl["atleta_id"],
                slug=atl.get("slug"),
                apelido=atl["apelido"],
                apelido_abreviado=atl.get("apelido_abreviado"),
                nome=atl.get("nome"),
                foto=atl.get("foto"),
                clube_id=atl["clube_id"],
                posicao_id=atl["posicao_id"],
                status_id=atl.get("status_id", 0),
                pontos_num=atl.get("pontos_num", 0),
                media_num=atl.get("media_num", 0),
                preco_num=atl.get("preco_num", 0),
                variacao_num=atl.get("variacao_num", 0),
                jogos_num=atl.get("jogos_num", 0),
                entrou_em_campo=atl.get("entrou_em_campo", False),
                rodada_id=atl.get("rodada_id"),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "apelido": atl["apelido"],
                    "apelido_abreviado": atl.get("apelido_abreviado"),
                    "nome": atl.get("nome"),
                    "foto": atl.get("foto"),
                    "clube_id": atl["clube_id"],
                    "posicao_id": atl["posicao_id"],
                    "status_id": atl.get("status_id", 0),
                    "pontos_num": atl.get("pontos_num", 0),
                    "media_num": atl.get("media_num", 0),
                    "preco_num": atl.get("preco_num", 0),
                    "variacao_num": atl.get("variacao_num", 0),
                    "jogos_num": atl.get("jogos_num", 0),
                    "entrou_em_campo": atl.get("entrou_em_campo", False),
                    "rodada_id": atl.get("rodada_id"),
                },
            )
            await self.db.execute(stmt)

            # Save scout data for the current round
            scout_data = atl.get("scout", {})
            rodada_id = atl.get("rodada_id")
            if rodada_id and scout_data:
                scout_values = {
                    SCOUT_MAP[k]: v
                    for k, v in scout_data.items()
                    if k in SCOUT_MAP
                }
                stmt_scout = pg_insert(ScoutRodada).values(
                    atleta_id=atl["atleta_id"],
                    rodada_id=rodada_id,
                    clube_id=atl["clube_id"],
                    posicao_id=atl["posicao_id"],
                    pontos_num=atl.get("pontos_num", 0),
                    preco_num=atl.get("preco_num", 0),
                    variacao_num=atl.get("variacao_num", 0),
                    media_num=atl.get("media_num", 0),
                    entrou_em_campo=atl.get("entrou_em_campo", False),
                    **scout_values,
                )
                stmt_scout = stmt_scout.on_conflict_do_update(
                    constraint="uq_scout_atleta_rodada",
                    set_={
                        "pontos_num": atl.get("pontos_num", 0),
                        "preco_num": atl.get("preco_num", 0),
                        "variacao_num": atl.get("variacao_num", 0),
                        "media_num": atl.get("media_num", 0),
                        "entrou_em_campo": atl.get("entrou_em_campo", False),
                        **scout_values,
                    },
                )
                await self.db.execute(stmt_scout)

            count += 1

        await self.db.commit()
        logger.info("sync_atletas_completed", count=count)
        return count

    async def sync_partidas(self) -> int:
        data = await self.api.get_partidas()
        partidas = data.get("partidas", [])
        rodada = data.get("rodada", 1)
        count = 0

        for p in partidas:
            partida_data = None
            if p.get("partida_data"):
                try:
                    partida_data = datetime.fromisoformat(p["partida_data"])
                except (ValueError, TypeError):
                    partida_data = None

            stmt = pg_insert(Partida).values(
                id=p["partida_id"],
                rodada_id=rodada,
                clube_casa_id=p["clube_casa_id"],
                clube_visitante_id=p["clube_visitante_id"],
                clube_casa_posicao=p.get("clube_casa_posicao"),
                clube_visitante_posicao=p.get("clube_visitante_posicao"),
                placar_oficial_mandante=p.get("placar_oficial_mandante"),
                placar_oficial_visitante=p.get("placar_oficial_visitante"),
                local=p.get("local"),
                partida_data=partida_data,
                valida=p.get("valida", False),
                aproveitamento_mandante=p.get("aproveitamento_mandante"),
                aproveitamento_visitante=p.get("aproveitamento_visitante"),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "clube_casa_posicao": p.get("clube_casa_posicao"),
                    "clube_visitante_posicao": p.get("clube_visitante_posicao"),
                    "placar_oficial_mandante": p.get("placar_oficial_mandante"),
                    "placar_oficial_visitante": p.get("placar_oficial_visitante"),
                    "valida": p.get("valida", False),
                    "aproveitamento_mandante": p.get("aproveitamento_mandante"),
                    "aproveitamento_visitante": p.get("aproveitamento_visitante"),
                },
            )
            await self.db.execute(stmt)
            count += 1

        await self.db.commit()
        logger.info("sync_partidas_completed", count=count)
        return count

    async def sync_mercado_status(self) -> int:
        data = await self.api.get_mercado_status()
        fechamento = data.get("fechamento", {})

        stmt = pg_insert(MercadoStatus).values(
            id=1,
            rodada_atual=data["rodada_atual"],
            status_mercado=data["status_mercado"],
            temporada=data["temporada"],
            game_over=data.get("game_over", False),
            times_escalados=data.get("times_escalados", 0),
            fechamento_timestamp=fechamento.get("timestamp"),
            atualizado_em=datetime.utcnow(),
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "rodada_atual": data["rodada_atual"],
                "status_mercado": data["status_mercado"],
                "temporada": data["temporada"],
                "game_over": data.get("game_over", False),
                "times_escalados": data.get("times_escalados", 0),
                "fechamento_timestamp": fechamento.get("timestamp"),
                "atualizado_em": datetime.utcnow(),
            },
        )
        await self.db.execute(stmt)
        await self.db.commit()
        logger.info("sync_mercado_status_completed")
        return 1
