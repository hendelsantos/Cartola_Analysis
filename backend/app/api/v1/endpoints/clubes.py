from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.clube import Clube
from app.schemas.clube import ClubeResponse, ClubeListResponse

router = APIRouter()


@router.get("", response_model=ClubeListResponse)
async def list_clubes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Clube).where(Clube.slug != "").order_by(Clube.nome_fantasia)
    )
    clubes = result.scalars().all()
    return ClubeListResponse(
        clubes=[ClubeResponse.model_validate(c) for c in clubes],
        total=len(clubes),
    )


@router.get("/{clube_id}", response_model=ClubeResponse)
async def get_clube(clube_id: int, db: AsyncSession = Depends(get_db)):
    clube = await db.get(Clube, clube_id)
    if not clube:
        raise HTTPException(status_code=404, detail="Clube não encontrado")
    return ClubeResponse.model_validate(clube)
