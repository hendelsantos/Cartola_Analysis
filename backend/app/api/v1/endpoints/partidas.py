from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.partida import Partida
from app.models.clube import Clube
from app.schemas.partida import PartidaResponse, PartidaListResponse

router = APIRouter()


@router.get("", response_model=PartidaListResponse)
async def list_partidas(
    rodada_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Partida)
        .options(
            selectinload(Partida.clube_casa),
            selectinload(Partida.clube_visitante),
        )
        .order_by(Partida.partida_data)
    )
    if rodada_id:
        query = query.where(Partida.rodada_id == rodada_id)

    result = await db.execute(query)
    partidas = result.scalars().unique().all()

    response_list = []
    for p in partidas:
        resp = PartidaResponse(
            id=p.id,
            rodada_id=p.rodada_id,
            clube_casa_id=p.clube_casa_id,
            clube_visitante_id=p.clube_visitante_id,
            clube_casa_posicao=p.clube_casa_posicao,
            clube_visitante_posicao=p.clube_visitante_posicao,
            placar_oficial_mandante=p.placar_oficial_mandante,
            placar_oficial_visitante=p.placar_oficial_visitante,
            local=p.local,
            partida_data=p.partida_data,
            valida=p.valida,
            aproveitamento_mandante=p.aproveitamento_mandante,
            aproveitamento_visitante=p.aproveitamento_visitante,
            clube_casa_nome=p.clube_casa.nome_fantasia if p.clube_casa else None,
            clube_visitante_nome=p.clube_visitante.nome_fantasia if p.clube_visitante else None,
        )
        response_list.append(resp)

    return PartidaListResponse(
        partidas=response_list,
        rodada=rodada_id or 0,
        total=len(response_list),
    )
