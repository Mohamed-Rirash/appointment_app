from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class EmailConfig(BaseSettings):
    """
    Email configuration for the Resend API.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    MAIL_PASSWORD: SecretStr
    MAIL_FROM: str = "noreply@example.com"
    MAIL_FROM_NAME: str = "MyApp"
    TEMPLATE_FOLDER: Path = Path(__file__).parent.parent.parent / "templates"


@lru_cache
def get_email_settings() -> EmailConfig:
    """Return cached email settings"""
    return EmailConfig()
