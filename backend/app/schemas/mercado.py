from pydantic import BaseModel
from datetime import datetime


class MercadoStatusResponse(BaseModel):
    rodada_atual: int
    status_mercado: int
    status_label: str
    temporada: int
    game_over: bool
    times_escalados: int
    fechamento_timestamp: int | None = None
    atualizado_em: datetime | None = None

    model_config = {"from_attributes": True}
