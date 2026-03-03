from fastapi import APIRouter
from app.api.v1.endpoints import atletas, clubes, partidas, rodadas, mercado, analytics, sync, predictions

router = APIRouter(prefix="/v1")

router.include_router(atletas.router, prefix="/atletas", tags=["Atletas"])
router.include_router(clubes.router, prefix="/clubes", tags=["Clubes"])
router.include_router(partidas.router, prefix="/partidas", tags=["Partidas"])
router.include_router(rodadas.router, prefix="/rodadas", tags=["Rodadas"])
router.include_router(mercado.router, prefix="/mercado", tags=["Mercado"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
router.include_router(sync.router, prefix="/sync", tags=["Sync"])
