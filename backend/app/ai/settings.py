"""Settings facade for AI module pulling from main app settings or env."""
from functools import cached_property
import os
from pathlib import Path
from app.core.config import settings as _core


class AISettings:
    @cached_property
    def GDRIVE_SERVICE_ACCOUNT_FILE(self) -> str:
        return os.getenv("GDRIVE_SERVICE_ACCOUNT_FILE", "service_account.json")

    @cached_property
    def BUSINESS_PLAN_DOC_ID(self) -> str:
        return os.getenv("BUSINESS_PLAN_DOC_ID", "")

    @cached_property
    def DRIVE_WEBHOOK_TOKEN(self) -> str | None:
        return os.getenv("DRIVE_WEBHOOK_TOKEN")

    @cached_property
    def DATA_DIR(self) -> str:
        return os.getenv("AI_DATA_DIR", "/tmp")

    # Reuse DB URL from core settings
    @cached_property
    def DATABASE_URL(self) -> str:
        return _core.SQLALCHEMY_DATABASE_URI.replace("+psycopg", "")  # psycopg connect()


settings = AISettings()
