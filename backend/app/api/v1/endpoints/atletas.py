from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.atleta import Atleta
from app.models.clube import Clube
from app.models.posicao import Posicao
from app.schemas.atleta import AtletaResponse, AtletaListResponse

router = APIRouter()

STATUS_MAP = {
    2: "Dúvida",
    3: "Suspenso",
    5: "Contundido",
    6: "Nulo",
    7: "Provável",
}


def _atleta_to_response(a: Atleta) -> AtletaResponse:
    """Convert an Atleta (with loaded relationships) to AtletaResponse."""
    return AtletaResponse(
        id=a.id,
        slug=a.slug,
        apelido=a.apelido,
        apelido_abreviado=a.apelido_abreviado,
        nome=a.nome,
        foto=a.foto,
        clube_id=a.clube_id,
        posicao_id=a.posicao_id,
        status_id=a.status_id,
        pontos_num=a.pontos_num,
        media_num=a.media_num,
        preco_num=a.preco_num,
        variacao_num=a.variacao_num,
        jogos_num=a.jogos_num,
        entrou_em_campo=a.entrou_em_campo,
        clube_nome=a.clube.nome_fantasia if a.clube else None,
        posicao_nome=a.posicao.nome if a.posicao else None,
    )


@router.get("", response_model=AtletaListResponse)
async def list_atletas(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    clube_id: int | None = None,
    posicao_id: int | None = None,
    status_id: int | None = None,
    ordem: str = Query("media", pattern="^(media|preco|pontos|variacao|jogos)$"),
    direcao: str = Query("desc", pattern="^(asc|desc)$"),
    busca: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Atleta).options(
        selectinload(Atleta.clube),
        selectinload(Atleta.posicao),
    )

    # Filters
    if clube_id:
        query = query.where(Atleta.clube_id == clube_id)
    if posicao_id:
        query = query.where(Atleta.posicao_id == posicao_id)
    if status_id:
        query = query.where(Atleta.status_id == status_id)
    if busca:
        query = query.where(Atleta.apelido.ilike(f"%{busca}%"))

    # Count (no need to load relationships for count)
    count_base = select(Atleta.id)
    if clube_id:
        count_base = count_base.where(Atleta.clube_id == clube_id)
    if posicao_id:
        count_base = count_base.where(Atleta.posicao_id == posicao_id)
    if status_id:
        count_base = count_base.where(Atleta.status_id == status_id)
    if busca:
        count_base = count_base.where(Atleta.apelido.ilike(f"%{busca}%"))
    count_query = select(func.count()).select_from(count_base.subquery())

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Order
    order_map = {
        "media": Atleta.media_num,
        "preco": Atleta.preco_num,
        "pontos": Atleta.pontos_num,
        "variacao": Atleta.variacao_num,
        "jogos": Atleta.jogos_num,
    }
    order_col = order_map.get(ordem, Atleta.media_num)
    if direcao == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(order_col)

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    atletas = result.scalars().unique().all()

    return AtletaListResponse(
        atletas=[_atleta_to_response(a) for a in atletas],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{atleta_id}", response_model=AtletaResponse)
async def get_atleta(atleta_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Atleta)
        .options(selectinload(Atleta.clube), selectinload(Atleta.posicao))
        .where(Atleta.id == atleta_id)
    )
    atleta = result.scalars().first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta não encontrado")

    return _atleta_to_response(atleta)
