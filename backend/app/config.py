from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str = "change-me-in-production"
    APP_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    PORT: int = 8000

    # Database - Railway provides DATABASE_URL as postgresql://
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cartola_analytics"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Ensure we always have asyncpg driver for async engine."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def DATABASE_URL_SYNC(self) -> str:
        return self.ASYNC_DATABASE_URL.replace("+asyncpg", "")

    # Redis (optional in Railway)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Cartola API
    CARTOLA_API_BASE_URL: str = "https://api.cartola.globo.com"

    # Sync
    SYNC_INTERVAL_MINUTES: int = 30

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
