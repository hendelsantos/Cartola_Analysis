from pydantic import BaseModel


class ScoutRodadaResponse(BaseModel):
    id: int
    atleta_id: int
    rodada_id: int
    clube_id: int
    posicao_id: int
    pontos_num: float
    preco_num: float
    variacao_num: float
    media_num: float
    entrou_em_campo: bool

    # Scouts
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

    model_config = {"from_attributes": True}
