from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    JWT_SECRET: str = Field(..., alias="SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"  # default if missing
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 50
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10
    DEBUG: bool = False
    ENVIRONMENT: str = "local"

    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore", populate_by_name=True
    )


@lru_cache
def get_auth_settings() -> AuthSettings:
    return AuthSettings()  # pyright: ignore[reportReturnType]
