# from functools import lru_cache
# from pathlib import Path
# from typing import Optional

# from pydantic import BaseSettings, SecretStr
# from pydantic_settings import SettingsConfigDict


# class EmailConfig(BaseSettings):
#     model_config = SettingsConfigDict(
#         env_file="backend/.env",
#         env_ignore_empty=True,
#         extra="ignore",
#     )
#     MAIL_USERNAME: str
#     MAIL_PASSWORD: SecretStr
#     MAIL_PORT: int
#     MAIL_SERVER: str
#     MAIL_STARTTLS: bool
#     MAIL_SSL_TLS: bool
#     MAIL_DEBUG: bool
#     MAIL_FROM: str
#     MAIL_FROM_NAME: str
#     TEMPLATE_FOLDER: Path = Path(__file__).parent.parent / "templates"
#     USE_CREDENTIALS: bool


# @lru_cache()
# def get_email_settings() -> EmailConfig:
#     return EmailConfig()
