"""Application settings loaded from environment variables."""

import logging
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """WealthAgent application settings."""

    anthropic_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./wealthagent.db"
    sqlite_fallback: bool = True
    news_api_key: str = ""
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
