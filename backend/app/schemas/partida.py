from pydantic import BaseModel
from datetime import datetime


class PartidaResponse(BaseModel):
    id: int
    rodada_id: int
    clube_casa_id: int
    clube_visitante_id: int
    clube_casa_posicao: int | None = None
    clube_visitante_posicao: int | None = None
    placar_oficial_mandante: int | None = None
    placar_oficial_visitante: int | None = None
    local: str | None = None
    partida_data: datetime | None = None
    valida: bool = False
    aproveitamento_mandante: list[str] | None = None
    aproveitamento_visitante: list[str] | None = None

    # Nested
    clube_casa_nome: str | None = None
    clube_visitante_nome: str | None = None

    model_config = {"from_attributes": True}


class PartidaListResponse(BaseModel):
    partidas: list[PartidaResponse]
    rodada: int
    total: int
