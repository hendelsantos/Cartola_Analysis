from pydantic import BaseModel


class PosicaoResponse(BaseModel):
    id: int
    nome: str
    abreviacao: str

    model_config = {"from_attributes": True}


class ScoutAgregado(BaseModel):
    gols: int = 0
    assistencias: int = 0
    finalizacao_trave: int = 0
    finalizacao_defendida: int = 0
    finalizacao_fora: int = 0
    faltas_sofridas: int = 0
    faltas_cometidas: int = 0
    cartao_amarelo: int = 0
    cartao_vermelho: int = 0
    impedimentos: int = 0
    desarmes: int = 0
    defesas: int = 0
    gols_sofridos: int = 0
    saldo_gol: int = 0
    defesa_penalti: int = 0
    gol_contra: int = 0
    penalti_cometido: int = 0
    penalti_sofrido: int = 0
    vitoria: int = 0


class AtletaResponse(BaseModel):
    id: int
    slug: str | None = None
    apelido: str
    apelido_abreviado: str | None = None
    nome: str | None = None
    foto: str | None = None
    clube_id: int
    posicao_id: int
    status_id: int
    pontos_num: float
    media_num: float
    preco_num: float
    variacao_num: float
    jogos_num: int
    entrou_em_campo: bool

    # Nested
    clube_nome: str | None = None
    posicao_nome: str | None = None
    scout: ScoutAgregado | None = None

    model_config = {"from_attributes": True}


class AtletaResumoResponse(BaseModel):
    id: int
    apelido: str
    foto: str | None = None
    clube_id: int
    posicao_id: int
    media_num: float
    preco_num: float
    variacao_num: float
    jogos_num: int
    pontos_num: float

    model_config = {"from_attributes": True}


class AtletaListResponse(BaseModel):
    atletas: list[AtletaResponse]
    total: int
    page: int
    per_page: int
