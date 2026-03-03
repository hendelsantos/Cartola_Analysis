import structlog
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from app.core.dependencies import get_prediction_service
from app.services.prediction_service import PredictionService
from app.schemas.prediction import (
    PlayerPrediction,
    LineupResponse,
    PositionRankingsResponse,
    ScoutProfileResponse,
)

router = APIRouter()
logger = structlog.get_logger()


@router.get("/player/{atleta_id}")
async def predict_player(
    atleta_id: int,
    service: PredictionService = Depends(get_prediction_service),
):
    """Previsão detalhada de pontuação para um atleta."""
    try:
        return await service.predict_player_score(atleta_id)
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        logger.error("predict_player_error", atleta_id=atleta_id, error=str(e))
        return JSONResponse(status_code=200, content={"error": str(e)})


@router.get("/all")
async def predict_all(
    min_jogos: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    service: PredictionService = Depends(get_prediction_service),
):
    """Previsões para todos os jogadores elegíveis."""
    try:
        predictions = await service.predict_all_players(min_jogos=min_jogos)
        return {"predictions": predictions[:limit], "total": len(predictions)}
    except Exception as e:
        logger.error("predict_all_error", error=str(e))
        return JSONResponse(status_code=200, content={"predictions": [], "total": 0, "error": str(e)})


@router.get("/position/{posicao_id}")
async def predict_by_position(
    posicao_id: int,
    limit: int = Query(20, ge=1, le=50),
    service: PredictionService = Depends(get_prediction_service),
):
    """Top previsões por posição."""
    try:
        return await service.predict_by_position(posicao_id, limit=limit)
    except Exception as e:
        logger.error("predict_by_position_error", error=str(e))
        return JSONResponse(status_code=200, content=[])


@router.get("/position-rankings")
async def position_rankings(
    limit: int = Query(15, ge=1, le=50),
    service: PredictionService = Depends(get_prediction_service),
):
    """Rankings por posição com projeções."""
    try:
        return await service.get_position_rankings(limit=limit)
    except Exception as e:
        logger.error("position_rankings_error", error=str(e))
        return JSONResponse(status_code=200, content={"error": str(e)})


@router.get("/scout-profile/{atleta_id}")
async def scout_profile(
    atleta_id: int,
    service: PredictionService = Depends(get_prediction_service),
):
    """Perfil detalhado de scouts para gráficos radar."""
    try:
        return await service.get_player_scout_profile(atleta_id)
    except Exception as e:
        logger.error("scout_profile_error", error=str(e))
        return JSONResponse(status_code=200, content={"error": str(e)})


@router.post("/lineup")
async def build_lineup(
    budget: float = Query(140.0, ge=50, le=300),
    formation: str = Query("4-4-2"),
    strategy: str = Query("balanced", pattern="^(balanced|aggressive|conservative|value)$"),
    service: PredictionService = Depends(get_prediction_service),
):
    """
    Montar escalação otimizada.

    - **budget**: Orçamento em cartoletas (padrão: 140)
    - **formation**: Formação (3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, 5-4-1)
    - **strategy**: Estratégia de otimização
      - balanced: maximiza pontuação prevista
      - aggressive: favorece jogadores explosivos
      - conservative: favorece jogadores consistentes
      - value: maximiza custo-benefício
    """
    try:
        return await service.build_optimal_lineup(
            budget=budget,
            formation=formation,
            strategy=strategy,
        )
    except ValueError as e:
        return JSONResponse(
            status_code=200,
            content={"success": False, "message": str(e), "players": []},
        )
    except Exception as e:
        logger.error("build_lineup_error", error=str(e))
        return JSONResponse(
            status_code=200,
            content={"success": False, "message": f"Erro ao montar escalação: {str(e)}", "players": []},
        )
