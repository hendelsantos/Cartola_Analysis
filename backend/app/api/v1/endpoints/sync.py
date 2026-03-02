from fastapi import APIRouter, Depends
from app.core.dependencies import get_sync_service
from app.services.sync_service import SyncService

router = APIRouter()


@router.post("/full")
async def sync_all(service: SyncService = Depends(get_sync_service)):
    """Trigger full data sync from Cartola API."""
    results = await service.sync_all()
    return {"status": "ok", "synced": results}


@router.post("/clubes")
async def sync_clubes(service: SyncService = Depends(get_sync_service)):
    count = await service.sync_clubes()
    return {"status": "ok", "count": count}


@router.post("/atletas")
async def sync_atletas(service: SyncService = Depends(get_sync_service)):
    count = await service.sync_atletas()
    return {"status": "ok", "count": count}


@router.post("/rodadas")
async def sync_rodadas(service: SyncService = Depends(get_sync_service)):
    count = await service.sync_rodadas()
    return {"status": "ok", "count": count}


@router.post("/partidas")
async def sync_partidas(service: SyncService = Depends(get_sync_service)):
    count = await service.sync_partidas()
    return {"status": "ok", "count": count}


@router.post("/mercado")
async def sync_mercado(service: SyncService = Depends(get_sync_service)):
    count = await service.sync_mercado_status()
    return {"status": "ok", "count": count}
