"""
appointement_booking_app - Application Configuration
Generated from FastAPI Production Boilerplate
"""

from typing import Annotated, Any, List, Literal, Optional

from pydantic import (
    AnyUrl,
    BeforeValidator,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    # --------------------
    # PROJECT INFO
    # --------------------
    PROJECT_NAME: str = "appointement_booking_app"
    ENVIRONMENT: Literal["local", "development", "staging", "production"] = "local"
    API_V1_STR: str = "/api/v1"

    FRONTEND_HOST: str = "http://localhost:3000"

    # --------------------
    # SECURITY & AUTH
    # --------------------
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    # Optional JWT hardening
    JWT_ISSUER: Optional[str] = None
    JWT_AUDIENCE: Optional[str] = None
    JWT_DENYLIST_ENABLED: bool = False

    # --------------------
    # DATABASE
    # --------------------

    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "appointement_app"

    @computed_field  # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"  # type: ignore

    # --------------------
    # REDIS & CACHING
    # --------------------

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_SSL: bool = False
    CACHE_TTL: int = 300
    CACHE_PREFIX: str = "appointement_booking_app_app"

    # --------------------
    # RATE LIMITING
    # --------------------

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    RATE_LIMIT_STORAGE_URL: Optional[str] = None

    # Endpoint-specific rate limiting (applies per route and client)
    ENDPOINT_RATE_LIMIT_ENABLED: bool = True
    ENDPOINT_RATE_LIMIT_REQUESTS: int = 10
    ENDPOINT_RATE_LIMIT_WINDOW: int = 60

    # --------------------
    # LOGGING & MONITORING
    # --------------------
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    LOG_FILE: Optional[str] = None
    LOG_ROTATION: str = "1 day"
    LOG_RETENTION: str = "30 days"

    REQUEST_LOGGING: bool = False

    ENABLE_METRICS: bool = False

    # (API key settings removed; not used)

    # --------------------
    # BOOTSTRAP / INITIALIZATION
    # --------------------
    # Run RBAC initialization on app startup (safe, idempotent). Enable in production only when needed.
    INIT_RBAC_ON_STARTUP: bool = True

    # --------------------
    # SECURITY HEADERS & MIDDLEWARE
    # --------------------
    ENABLE_SECURITY_HEADERS: bool = True
    ALLOWED_HOSTS: List[str] = ["*"]
    TRUSTED_PROXIES: List[str] = []
    MAX_REQUEST_SIZE: int = 16 * 1024 * 1024  # 16MB
    REQUEST_TIMEOUT: int = 30

    # --------------------
    # CORS
    # --------------------

    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = [
        "http://localhost:3000"
    ]
    USE_CREDENTIALS: bool = True

    # --------------------
    # EMAIL DOMAIN RESTRICTIONS
    # --------------------

    ALLOWED_EMAIL_DOMAINS: List[str] = ["gmail.com", "amoud.org"]
    ENFORCE_EMAIL_DOMAIN: bool = True

    # --------------------
    # EMAIL SETTINGS
    # --------------------
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_PORT: int = 1025
    MAIL_SERVER: str = "mailpit"
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = False
    MAIL_DEBUG: bool = True
    MAIL_FROM: str = "noreply@test.com"
    MAIL_FROM_NAME: str = "App"
    SUPPRESS_SEND: bool = False

    # --------------------
    # THIRD-PARTY & EXTERNAL
    # --------------------
    SENTRY_DSN: HttpUrl | None = None
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    SENTRY_ENVIRONMENT: Optional[str] = None

    # --------------------
    # FIRST SUPERUSER (bootstrap)
    # --------------------
    FIRST_SUPERUSER: Optional[str] = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                print(message)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> "Settings":
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)

        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)

        return self

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT in ("local", "development")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()


def get_settings() -> Settings:
    return settings
