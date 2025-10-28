from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class EmailConfig(BaseSettings):
    """
    Central email configuration using environment variables.
    Compatible with FastAPI-Mail and SMTP.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: SecretStr = ""  # pyright: ignore[reportAssignmentType]
    MAIL_FROM: str = "noreply@test.com"
    MAIL_FROM_NAME: str = "App"
    MAIL_SERVER: str = "mailpit"  # or "smtp.gmail.com"
    MAIL_PORT: int = 1025  # Gmail uses 587
    MAIL_STARTTLS: bool = False  # Gmail -> True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = False
    MAIL_DEBUG: int = 1
    TEMPLATE_FOLDER: Path = Path(__file__).parent.parent.parent / "templates"

    @field_validator("MAIL_DEBUG", mode="before")
    @classmethod
    def parse_mail_debug(cls, v: Any) -> int:
        """Convert string 'True'/'False' to int 1/0"""
        if isinstance(v, str):
            return 1 if v.lower() in ("true", "1", "yes", "on") else 0
        return int(v)

    @field_validator("MAIL_PORT", mode="before")
    @classmethod
    def parse_mail_port(cls, v: Any) -> int:
        """Convert string port to int"""
        if isinstance(v, str):
            return int(v)
        return v

    @field_validator("MAIL_STARTTLS", "MAIL_SSL_TLS", "USE_CREDENTIALS", mode="before")
    @classmethod
    def parse_bool_fields(cls, v: Any) -> bool:
        """Convert string 'True'/'False' to bool"""
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return bool(v)


@lru_cache
def get_email_settings() -> EmailConfig:
    """Return cached email settings"""
    return EmailConfig()
