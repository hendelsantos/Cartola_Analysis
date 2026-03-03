"""Dicas da Rodada — actionable round tips endpoints."""

import structlog
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from app.core.dependencies import get_tips_service
from app.services.tips_service import TipsService

router = APIRouter()
logger = structlog.get_logger()


@router.get("/rodada")
async def get_round_tips(
    budget: float = Query(default=140.0, ge=50, le=500, description="Orçamento disponível"),
    formation: str = Query(default="4-4-2", description="Formação tática"),
    service: TipsService = Depends(get_tips_service),
):
    """Dicas completas da rodada — capitão, picks, moonshots, evitar e escalação rápida.

    O endpoint principal para decidir quem escalar antes de cada rodada.
    """
    try:
        return await service.get_round_tips(budget=budget, formation=formation)
    except Exception as e:
        logger.error("tips_error", error=str(e))
        return JSONResponse(
            status_code=200,
            content={
                "error": f"Erro ao gerar dicas: {str(e)}",
                "capitao": None,
                "vice_capitao": None,
                "picks": {},
                "moonshots": [],
                "evitar": [],
                "tiers": {"baratos": [], "medio": [], "premium": []},
                "escalacao": {"formation": formation, "budget": budget, "total_price": 0, "remaining": budget, "total_xpts": 0, "players": [], "count": 0},
                "resumo": {},
            },
        )
