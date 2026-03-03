"""Moneyball analytics endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_moneyball_service
from app.services.moneyball_service import MoneyballService

router = APIRouter()


@router.get("/analysis")
async def get_moneyball_analysis(
    min_jogos: int = Query(default=3, ge=1, le=38, description="Mínimo de jogos para análise"),
    service: MoneyballService = Depends(get_moneyball_service),
):
    """Full Moneyball analysis — all players with market inefficiency metrics.

    Returns all player analytics including alpha score, xPts, regression,
    momentum, consistency, and scout averages. Frontend filters/sorts locally.
    """
    return await service.get_full_analysis(min_jogos=min_jogos)


@router.get("/correlations")
async def get_scout_correlations(
    service: MoneyballService = Depends(get_moneyball_service),
):
    """Scout DNA — which scouts truly correlate with high scores per position.

    Uses Pearson correlation to find what stats actually matter for each position,
    revealing market inefficiencies (what's overvalued vs undervalued).
    """
    return await service.get_scout_correlations()
