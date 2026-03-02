import structlog
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("starting_app", env=settings.APP_ENV)
    yield
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
    allow_origins=settings.APP_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────
app.include_router(v1_router, prefix="/api")


# ── Health check ─────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "env": settings.APP_ENV}


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
