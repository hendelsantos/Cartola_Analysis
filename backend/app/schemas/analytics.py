from pydantic import BaseModel


class ScoutMedio(BaseModel):
    gols_por_jogo: float = 0.0
    assistencias_por_jogo: float = 0.0
    desarmes_por_jogo: float = 0.0
    faltas_por_jogo: float = 0.0
    finalizacoes_por_jogo: float = 0.0
    cartoes_por_jogo: float = 0.0


class TendenciaPreco(BaseModel):
    variacao_total: float = 0.0
    variacao_media: float = 0.0
    tendencia: str = "estavel"  # subindo, descendo, estavel


class AtletaAnalyticsResponse(BaseModel):
    atleta_id: int
    apelido: str
    clube_nome: str
    posicao: str
    foto: str | None = None

    # Métricas calculadas
    media_pontos: float
    desvio_padrao: float
    maior_pontuacao: float
    menor_pontuacao: float
    regularidade: float  # % de rodadas acima da média
    aproveitamento_pontos: float  # pontos / pontos máximo possível

    # Scouts médios
    scout_medio: ScoutMedio

    # Tendência de preço
    tendencia_preco: TendenciaPreco

    # Custo-benefício
    pontos_por_cartoleta: float

    # Últimos 5 jogos
    ultimos_5_pontos: list[float]

    # Projeção
    projecao_proxima_rodada: float | None = None


class ClubeAnalyticsResponse(BaseModel):
    clube_id: int
    clube_nome: str
    escudo: str | None = None

    # Rankings
    media_pontos_time: float
    total_gols: int
    total_assistencias: int
    total_desarmes: int
    total_gols_sofridos: int
    total_saldo_gol: int

    # Melhores jogadores
    melhor_media: dict | None = None
    melhor_goleador: dict | None = None
    melhor_assistente: dict | None = None

    # Forma (últimos 5 jogos)
    forma: list[str] = []  # V, E, D
    aproveitamento: float = 0.0


class AtletaEscalacao(BaseModel):
    atleta_id: int
    apelido: str
    clube_nome: str
    posicao: str
    preco: float
    media: float
    projecao: float
    foto: str | None = None


class EscalacaoOtimizadaResponse(BaseModel):
    esquema: str
    preco_total: float
    media_total: float
    projecao_total: float
    cartoletas_restantes: float
    jogadores: list[AtletaEscalacao]
