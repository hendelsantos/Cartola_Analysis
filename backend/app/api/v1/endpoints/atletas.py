from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

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


@router.get("", response_model=AtletaListResponse)
async def list_atletas(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    clube_id: int | None = None,
    posicao_id: int | None = None,
    status_id: int | None = None,
    ordem: str = Query("media", regex="^(media|preco|pontos|variacao|jogos)$"),
    direcao: str = Query("desc", regex="^(asc|desc)$"),
    busca: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Atleta)

    # Filters
    if clube_id:
        query = query.where(Atleta.clube_id == clube_id)
    if posicao_id:
        query = query.where(Atleta.posicao_id == posicao_id)
    if status_id:
        query = query.where(Atleta.status_id == status_id)
    if busca:
        query = query.where(Atleta.apelido.ilike(f"%{busca}%"))

    # Count
    count_query = select(func.count()).select_from(query.subquery())
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
    atletas = result.scalars().all()

    # Enrich with club and position names
    response_list = []
    for a in atletas:
        clube = await db.get(Clube, a.clube_id)
        posicao = await db.get(Posicao, a.posicao_id)
        resp = AtletaResponse(
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
            clube_nome=clube.nome_fantasia if clube else None,
            posicao_nome=posicao.nome if posicao else None,
        )
        response_list.append(resp)

    return AtletaListResponse(
        atletas=response_list, total=total, page=page, per_page=per_page
    )


@router.get("/{atleta_id}", response_model=AtletaResponse)
async def get_atleta(atleta_id: int, db: AsyncSession = Depends(get_db)):
    atleta = await db.get(Atleta, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta não encontrado")

    clube = await db.get(Clube, atleta.clube_id)
    posicao = await db.get(Posicao, atleta.posicao_id)

    return AtletaResponse(
        id=atleta.id,
        slug=atleta.slug,
        apelido=atleta.apelido,
        apelido_abreviado=atleta.apelido_abreviado,
        nome=atleta.nome,
        foto=atleta.foto,
        clube_id=atleta.clube_id,
        posicao_id=atleta.posicao_id,
        status_id=atleta.status_id,
        pontos_num=atleta.pontos_num,
        media_num=atleta.media_num,
        preco_num=atleta.preco_num,
        variacao_num=atleta.variacao_num,
        jogos_num=atleta.jogos_num,
        entrou_em_campo=atleta.entrou_em_campo,
        clube_nome=clube.nome_fantasia if clube else None,
        posicao_nome=posicao.nome if posicao else None,
    )
