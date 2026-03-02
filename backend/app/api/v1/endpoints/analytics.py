from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_analytics_service
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import AtletaAnalyticsResponse, ClubeAnalyticsResponse

router = APIRouter()


@router.get("/atleta/{atleta_id}", response_model=AtletaAnalyticsResponse)
async def get_atleta_analytics(
    atleta_id: int,
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_atleta_analytics(atleta_id)


@router.get("/clube/{clube_id}", response_model=ClubeAnalyticsResponse)
async def get_clube_analytics(
    clube_id: int,
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_clube_analytics(clube_id)


@router.get("/rankings/pontuadores")
async def get_top_pontuadores(
    limit: int = Query(20, ge=1, le=100),
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_top_pontuadores(limit=limit)


@router.get("/rankings/valorizacoes")
async def get_top_valorizacoes(
    limit: int = Query(20, ge=1, le=100),
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_top_valorizacoes(limit=limit)


@router.get("/rankings/custo-beneficio")
async def get_custo_beneficio(
    limit: int = Query(20, ge=1, le=100),
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_custo_beneficio(limit=limit)
