from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.cartola_api import cartola_client, CartolaAPIClient
from app.services.sync_service import SyncService
from app.services.analytics_service import AnalyticsService
from app.services.prediction_service import PredictionService
from app.services.moneyball_service import MoneyballService
from app.services.tips_service import TipsService


async def get_sync_service(
    db: AsyncSession = Depends(get_db),
) -> SyncService:
    return SyncService(db=db, api_client=cartola_client)


async def get_analytics_service(
    db: AsyncSession = Depends(get_db),
) -> AnalyticsService:
    return AnalyticsService(db=db)


async def get_prediction_service(
    db: AsyncSession = Depends(get_db),
) -> PredictionService:
    return PredictionService(db=db)


async def get_moneyball_service(
    db: AsyncSession = Depends(get_db),
) -> MoneyballService:
    return MoneyballService(db=db)


async def get_tips_service(
    db: AsyncSession = Depends(get_db),
) -> TipsService:
    return TipsService(db=db)


def get_cartola_client() -> CartolaAPIClient:
    return cartola_client
