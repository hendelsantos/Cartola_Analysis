"""HTTP client for the Cartola FC public API."""

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class CartolaAPIClient:
    """Async HTTP client with retry logic for the Cartola API."""

    BASE_URL = settings.CARTOLA_API_BASE_URL

    ENDPOINTS = {
        "mercado_status": "/mercado/status",
        "atletas_mercado": "/atletas/mercado",
        "atletas_pontuados": "/atletas/pontuados",
        "destaques": "/pos-rodada/destaques",
        "clubes": "/clubes",
        "posicoes": "/posicoes",
        "patrocinadores": "/patrocinadores",
        "partidas": "/partidas",
        "partidas_rodada": "/partidas/{rodada}",
        "mercado_destaques": "/mercado/destaques",
        "mercado_destaques_reservas": "/mercado/destaques/reservas",
        "rodadas": "/rodadas",
        "pontuados": "/atletas/pontuados",
        "rankings": "/rankings",
        "ligas": "/ligas",
        "esquemas": "/esquemas",
    }

    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                timeout=httpx.Timeout(30.0, connect=10.0),
                headers={
                    "User-Agent": "CartolaAnalytics/1.0",
                    "Accept": "application/json",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def _get(self, endpoint: str, **kwargs) -> dict | list:
        client = await self._get_client()
        response = await client.get(endpoint, **kwargs)
        response.raise_for_status()
        return response.json()

    # ──────────────────────────────────────────────
    # Public API methods
    # ──────────────────────────────────────────────

    async def get_mercado_status(self) -> dict:
        logger.info("fetching_mercado_status")
        return await self._get(self.ENDPOINTS["mercado_status"])

    async def get_atletas_mercado(self) -> dict:
        logger.info("fetching_atletas_mercado")
        return await self._get(self.ENDPOINTS["atletas_mercado"])

    async def get_atletas_pontuados(self) -> dict:
        logger.info("fetching_atletas_pontuados")
        return await self._get(self.ENDPOINTS["atletas_pontuados"])

    async def get_clubes(self) -> dict:
        logger.info("fetching_clubes")
        return await self._get(self.ENDPOINTS["clubes"])

    async def get_posicoes(self) -> dict:
        logger.info("fetching_posicoes")
        return await self._get(self.ENDPOINTS["posicoes"])

    async def get_rodadas(self) -> list:
        logger.info("fetching_rodadas")
        return await self._get(self.ENDPOINTS["rodadas"])

    async def get_partidas(self) -> dict:
        logger.info("fetching_partidas")
        return await self._get(self.ENDPOINTS["partidas"])

    async def get_partidas_rodada(self, rodada: int) -> dict:
        logger.info("fetching_partidas_rodada", rodada=rodada)
        endpoint = self.ENDPOINTS["partidas_rodada"].format(rodada=rodada)
        return await self._get(endpoint)

    async def get_mercado_destaques(self) -> dict:
        logger.info("fetching_mercado_destaques")
        return await self._get(self.ENDPOINTS["mercado_destaques"])

    async def get_destaques(self) -> dict:
        logger.info("fetching_destaques")
        return await self._get(self.ENDPOINTS["destaques"])

    async def get_esquemas(self) -> list:
        logger.info("fetching_esquemas")
        return await self._get(self.ENDPOINTS["esquemas"])

    async def get_rankings(self) -> dict:
        logger.info("fetching_rankings")
        return await self._get(self.ENDPOINTS["rankings"])


# Singleton
cartola_client = CartolaAPIClient()
