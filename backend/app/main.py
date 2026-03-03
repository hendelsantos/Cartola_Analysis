import structlog
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core import CartolaAPIError, NotFoundError, SyncError
from app.api.v1.router import router as v1_router
from app.services.cartola_api import cartola_client

settings = get_settings()
logger = structlog.get_logger()


async def _initial_sync():
    """Run initial data sync from Cartola API on startup."""
    from app.database import async_session_factory
    from app.services.sync_service import SyncService

    try:
        async with async_session_factory() as session:
            service = SyncService(db=session, api_client=cartola_client)
            results = await service.sync_all()
            logger.info("initial_sync_completed", results=results)
    except Exception as e:
        logger.error("initial_sync_failed", error=str(e))
        # Don't crash the app — data will be empty until next sync


async def _periodic_sync():
    """Background task: re-sync every N minutes."""
    interval = settings.SYNC_INTERVAL_MINUTES * 60
    while True:
        await asyncio.sleep(interval)
        try:
            await _initial_sync()
        except Exception as e:
            logger.error("periodic_sync_failed", error=str(e))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("starting_app", env=settings.APP_ENV)

    # Fire initial sync in background (non-blocking startup)
    sync_task = asyncio.create_task(_initial_sync())

    # Start periodic sync
    periodic_task = asyncio.create_task(_periodic_sync())

    yield

    # Cancel periodic sync
    periodic_task.cancel()
    try:
        await periodic_task
    except asyncio.CancelledError:
        pass

    await cartola_client.close()
    logger.info("shutdown_complete")


app = FastAPI(
    title="Cartola Analytics API",
    description="API profissional de análise de dados do Cartola FC",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.effective_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────
app.include_router(v1_router, prefix="/api")


# ── Health check ─────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    from app.database import async_session_factory
    from sqlalchemy import text

    db_ok = False
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if db_ok else "degraded",
        "env": settings.APP_ENV,
        "database": "connected" if db_ok else "disconnected",
    }


# ── Exception handlers ──────────────────────────────────────────
@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(CartolaAPIError)
async def cartola_api_error_handler(request: Request, exc: CartolaAPIError):
    logger.error("cartola_api_error", error=str(exc))
    return JSONResponse(
        status_code=502, content={"detail": "Erro ao consultar Cartola API"}
    )


@app.exception_handler(SyncError)
async def sync_error_handler(request: Request, exc: SyncError):
    logger.error("sync_error", error=str(exc))
    return JSONResponse(
        status_code=500, content={"detail": "Erro durante sincronização"}
    )
