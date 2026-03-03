from pydantic import BaseModel


# ── Prediction Response Schemas ─────────────────────────────────

class MethodBreakdown(BaseModel):
    weighted_avg: float
    scout_projection: float
    historic_avg: float
    form_factor: float
    opponent_factor: float


class PredictionScore(BaseModel):
    score: float
    min_score: float
    max_score: float
    confidence: float
    method_breakdown: MethodBreakdown


class ConsistencyMetrics(BaseModel):
    cv: float
    desvio_padrao: float
    rating: str
    acima_media_pct: float
    pontuou_positivo_pct: float


class FormMetrics(BaseModel):
    last_5: list[float]
    trend: str
    form_factor: float


class RiskMetrics(BaseModel):
    label: str
    volatility: float
    min_expected: float
    max_expected: float


class ValueMetrics(BaseModel):
    preco: float
    pontos_por_cartoleta: float
    rating: str


class PlayerPrediction(BaseModel):
    atleta_id: int
    apelido: str
    foto: str | None = None
    clube_nome: str
    clube_escudo: str
    posicao: str
    posicao_nome: str
    preco: float
    media_geral: float
    jogos: int
    prediction: PredictionScore
    consistency: ConsistencyMetrics
    form: FormMetrics
    risk: RiskMetrics
    value: ValueMetrics


# ── Lineup Response Schemas ─────────────────────────────────────

class LineupPlayer(BaseModel):
    atleta_id: int
    apelido: str
    foto: str | None = None
    clube_nome: str
    clube_escudo: str
    posicao: str
    posicao_nome: str
    preco: float
    media: float
    projecao: float
    confidence: float
    min_score: float
    max_score: float
    risk_label: str


class LineupResponse(BaseModel):
    success: bool
    formation: str
    strategy: str
    budget: float
    total_price: float = 0.0
    remaining_budget: float = 0.0
    total_prediction: float = 0.0
    total_media: float = 0.0
    players_count: int = 0
    players: list[LineupPlayer] = []
    message: str | None = None


# ── Position Rankings ───────────────────────────────────────────

class PositionPlayer(BaseModel):
    atleta_id: int
    apelido: str
    foto: str | None = None
    clube_nome: str
    clube_escudo: str
    preco: float
    media: float
    projecao: float
    confidence: float
    consistency: str
    trend: str
    value_rating: str


class PositionRanking(BaseModel):
    posicao: str
    jogadores: list[PositionPlayer]


class PositionRankingsResponse(BaseModel):
    goleiro: PositionRanking | None = None
    lateral: PositionRanking | None = None
    zagueiro: PositionRanking | None = None
    meia: PositionRanking | None = None
    atacante: PositionRanking | None = None


# ── Scout Profile ───────────────────────────────────────────────

class ScoutContribution(BaseModel):
    total: int
    points: float
    per_game: float


class ScoutProfile(BaseModel):
    gols: float = 0.0
    assistencias: float = 0.0
    finalizacoes: float = 0.0
    desarmes: float = 0.0
    faltas_sofridas: float = 0.0
    defesas: float = 0.0
    cartoes: float = 0.0
    vitorias_pct: float = 0.0
    saldo_gol_pct: float = 0.0


class ScoutProfileResponse(BaseModel):
    jogos_analisados: int
    profile: ScoutProfile
    contribution: dict[str, ScoutContribution]
