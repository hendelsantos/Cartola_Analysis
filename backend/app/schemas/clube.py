from pydantic import BaseModel


class ClubeResponse(BaseModel):
    id: int
    nome: str
    abreviacao: str
    slug: str | None = None
    apelido: str | None = None
    nome_fantasia: str
    escudo_60: str | None = None
    escudo_45: str | None = None
    escudo_30: str | None = None
    url_editoria: str | None = None

    model_config = {"from_attributes": True}


class ClubeListResponse(BaseModel):
    clubes: list[ClubeResponse]
    total: int
