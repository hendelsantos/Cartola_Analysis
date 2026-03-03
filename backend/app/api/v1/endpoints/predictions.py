from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_prediction_service
from app.services.prediction_service import PredictionService

router = APIRouter()


@router.get("/player/{atleta_id}")
async def predict_player(
    atleta_id: int,
    service: PredictionService = Depends(get_prediction_service),
):
    """Previsão detalhada de pontuação para um atleta."""
    return await service.predict_player_score(atleta_id)


@router.get("/all")
async def predict_all(
    min_jogos: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    service: PredictionService = Depends(get_prediction_service),
):
    """Previsões para todos os jogadores prováveis."""
    predictions = await service.predict_all_players(min_jogos=min_jogos)
    return {"predictions": predictions[:limit], "total": len(predictions)}


@router.get("/position/{posicao_id}")
async def predict_by_position(
    posicao_id: int,
    limit: int = Query(20, ge=1, le=50),
    service: PredictionService = Depends(get_prediction_service),
):
    """Top previsões por posição."""
    return await service.predict_by_position(posicao_id, limit=limit)


@router.get("/position-rankings")
async def position_rankings(
    limit: int = Query(15, ge=1, le=50),
    service: PredictionService = Depends(get_prediction_service),
):
    """Rankings por posição com projeções."""
    return await service.get_position_rankings(limit=limit)


@router.get("/scout-profile/{atleta_id}")
async def scout_profile(
    atleta_id: int,
    service: PredictionService = Depends(get_prediction_service),
):
    """Perfil detalhado de scouts para gráficos radar."""
    return await service.get_player_scout_profile(atleta_id)


@router.post("/lineup")
async def build_lineup(
    budget: float = Query(140.0, ge=50, le=300),
    formation: str = Query("4-4-2"),
    strategy: str = Query("balanced", regex="^(balanced|aggressive|conservative|value)$"),
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
    return await service.build_optimal_lineup(
        budget=budget,
        formation=formation,
        strategy=strategy,
    )
