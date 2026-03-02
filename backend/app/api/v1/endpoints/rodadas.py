from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.rodada import Rodada
from app.schemas.rodada import RodadaResponse, RodadaListResponse

router = APIRouter()


@router.get("", response_model=RodadaListResponse)
async def list_rodadas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rodada).order_by(Rodada.id))
    rodadas = result.scalars().all()
    return RodadaListResponse(
        rodadas=[RodadaResponse.model_validate(r) for r in rodadas],
        total=len(rodadas),
    )
