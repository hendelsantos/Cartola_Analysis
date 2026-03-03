"""Dicas da Rodada — actionable round tips endpoints."""

from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_tips_service
from app.services.tips_service import TipsService

router = APIRouter()


@router.get("/rodada")
async def get_round_tips(
    budget: float = Query(default=140.0, ge=50, le=500, description="Orçamento disponível"),
    formation: str = Query(default="4-4-2", description="Formação tática"),
    service: TipsService = Depends(get_tips_service),
):
    """Dicas completas da rodada — capitão, picks, moonshots, evitar e escalação rápida.

    O endpoint principal para decidir quem escalar antes de cada rodada.
    """
    return await service.get_round_tips(budget=budget, formation=formation)
