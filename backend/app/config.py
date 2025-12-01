"""
appointement_booking_app - Application Configuration
Generated from FastAPI Production Boilerplate
"""

from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    HttpUrl,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str]:
    """
    Parse CORS origins from environment variable.
    Handles:
      - Comma-separated strings: "http://a,http://b"
      - Empty values: "" or unset → []
      - Lists (for programmatic use)
    Always returns list[str].
    """
    if v is None:
        return []
    if isinstance(v, str):
        # Split by comma and clean whitespace; ignore empty parts
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    elif isinstance(v, list | tuple):
        return [str(origin).strip() for origin in v if origin]
    else:
        raise ValueError(f"Invalid CORS origin format: {v}")


def parse_hosts(v: Any) -> list[str]:
    """
    Parse allowed hosts from environment variable.
    Handles:
      - Comma-separated strings: "host1,host2"
      - JSON arrays: '["host1","host2"]'
      - Empty values: "" or unset → []
      - Lists (for programmatic use)
    Always returns list[str].
    """
    if v is None:
        return []
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return []
        # Try JSON first
        if v.startswith("["):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                pass
        # Fall back to comma-separated
        return [host.strip() for host in v.split(",") if host.strip()]
    elif isinstance(v, list | tuple):
        return [str(host).strip() for host in v if host]
    else:
        raise ValueError(f"Invalid allowed hosts format: {v}")


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
    SECRET_KEY: str = "CHANGE_ME_TO_STRONG_SECRET_32_CHARS_MIN"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes - reduced from 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    # Optional JWT hardening
    JWT_ISSUER: str | None = None
    JWT_AUDIENCE: str | None = None
    JWT_DENYLIST_ENABLED: bool = True  # Enable token denylist for logout

    # --------------------
    # DATABASE
    # --------------------

    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    @computed_field  # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        # type: ignore
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --------------------
    # REDIS & CACHING
    # --------------------

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None
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
    RATE_LIMIT_STORAGE_URL: str | None = None

    # Endpoint-specific rate limiting (applies per route and client)
    ENDPOINT_RATE_LIMIT_ENABLED: bool = True
    ENDPOINT_RATE_LIMIT_REQUESTS: int = 10
    ENDPOINT_RATE_LIMIT_WINDOW: int = 60

    # --------------------
    # LOGGING & MONITORING
    # --------------------
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # "json" or "text"
    LOG_FILE: str | None = None
    LOG_ROTATION: str = "1 day"
    LOG_RETENTION: str = "30 days"

    REQUEST_LOGGING: bool = True  # Enable request logging by default

    ENABLE_METRICS: bool = False

    # --------------------
    # SENTRY ERROR TRACKING
    # --------------------
    SENTRY_DSN: str | None = None
    SENTRY_ENVIRONMENT: str | None = None  # Defaults to ENVIRONMENT if not set
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0  # 1.0 = 100% of transactions
    SENTRY_PROFILES_SAMPLE_RATE: float = 1.0  # 1.0 = 100% of transactions
    SENTRY_ENABLED: bool = False  # Enable Sentry error tracking

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
    ALLOWED_HOSTS: Annotated[list[str], BeforeValidator(parse_hosts)] = ["localhost", "127.0.0.1"]  # Restrict to specific hosts
    TRUSTED_PROXIES: list[str] = []
    MAX_REQUEST_SIZE: int = 16 * 1024 * 1024  # 16MB
    REQUEST_TIMEOUT: int = 30

    # --------------------
    # CORS
    # --------------------

    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = [
        AnyUrl("http://localhost:3000"),
        AnyUrl("http://127.0.0.1:3000"),
    ]

    # --------------------
    # EMAIL DOMAIN RESTRICTIONS
    # --------------------

    ALLOWED_EMAIL_DOMAINS: list[str] = ["gmail.com", "amoud.org"]
    ENFORCE_EMAIL_DOMAIN: bool = True

    # --------------------
    # EMAIL/SMTP SETTINGS
    # --------------------
    # These are used by both email service and CORS middleware
    USE_CREDENTIALS: bool = True  # For CORS and SMTP authentication

    # --------------------
    # SMS SETTINGS
    # --------------------
    SMS_ENABLED: bool = True
    SMS_PROVIDER: str = "smscatcher"  # smscatcher, twilio, etc.
    SMS_HOST: str = "smscatcher"
    SMS_PORT: int = 3001
    SMS_API_URL: str = "http://smscatcher:3001/sms"  # Full URL for SMS service
    SMS_FROM: str = "+1234567890"
    SMS_API_KEY: str | None = None
    SMS_API_SECRET: str | None = None

    # --------------------
    # THIRD-PARTY & EXTERNAL
    # --------------------
    # SENTRY_DSN is already defined above in SENTRY ERROR TRACKING section

    # --------------------
    # FIRST SUPERUSER (bootstrap)
    # --------------------
    FIRST_SUPERUSER: str | None = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "CHANGE_ME_TO_STRONG_PASSWORD_32_CHARS_MIN"

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        """Validate secret values are strong and not defaults.

        - Disallow known weak placeholders like 'secret' and 'changethis'
        - Enforce minimum length of 32 characters for cryptographic keys
        - In local env, warn; in non-local envs, raise to fail-fast
        """
        weak_values = {
            "secret",
            "changethis",
            "CHANGE_ME_TO_STRONG_SECRET_32_CHARS_MIN",
            "CHANGE_ME_TO_STRONG_PASSWORD_32_CHARS_MIN",
            "",
            None,
        }
        message = None
        if value in weak_values:
            message = f"The value of {var_name} is a weak default. Please set a strong secret."
        elif isinstance(value, str) and len(value) < 32:
            message = f"The value of {var_name} is too short (min 32 chars)."

        if message:
            if self.ENVIRONMENT == "local":
                import warnings

                warnings.warn(message, stacklevel=2)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> "Settings":
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        # Only check SMS secrets if SMS is enabled
        if self.SMS_ENABLED:
            self._check_default_secret("SMS_API_KEY", self.SMS_API_KEY)
            self._check_default_secret("SMS_API_SECRET", self.SMS_API_SECRET)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

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
