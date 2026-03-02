from pydantic import BaseModel
from datetime import datetime


class RodadaResponse(BaseModel):
    id: int
    nome: str
    inicio: datetime
    fim: datetime

    model_config = {"from_attributes": True}


class RodadaListResponse(BaseModel):
    rodadas: list[RodadaResponse]
    total: int
