"""
FastAPI application with comprehensive security, RBAC, and middleware
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# from app.admin.middleware import AdminRateLimitMiddleware
# from app.admin.router import router as admin_router
from loguru import logger

from app.admin.router import router as admin_router
from app.appointments.routers import appointment_router

# Router imports
from app.auth.router import router as auth_router
from app.config import get_settings

# Sentry integration
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.loguru import LoguruIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    logger.warning("Sentry SDK not installed. Error tracking disabled.")
from app.core.cache import cache_manager
from app.core.middleware.caching import ResponseCachingMiddleware

# Middleware imports
from app.core.middleware.cors import setup_cors
from app.core.middleware.error_handling import (
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    ConflictError,
    ErrorHandlingMiddleware,
    RateLimitError,
    ResourceNotFoundError,
    authentication_error_handler,
    authorization_error_handler,
    business_logic_error_handler,
    conflict_error_handler,
    rate_limit_error_handler,
    resource_not_found_error_handler,
)
from app.core.middleware.logging import RequestLoggingMiddleware
from app.core.middleware.security import (
    ProxyHeadersMiddleware,
    RequestSizeMiddleware,
    RequestTimeoutMiddleware,
    SecurityHeadersMiddleware,
)
from app.database import database

# from app.items.router import router as items_router
from app.office_mgnt.router import hostavailableroutes
from app.office_mgnt.router import router as office_mgnt_router
from app.rate_limiting import (
    EndpointRateLimitMiddleware,
    RateLimitMiddleware,
    rate_limiter,
)

# from app.superadmin.router import router as superadmin_router

# API v1 routers removed


settings = get_settings()
# logger = get_logger(__name__)


def init_sentry():
    """Initialize Sentry error tracking"""
    if not SENTRY_AVAILABLE:
        logger.warning("Sentry SDK not available. Skipping Sentry initialization.")
        return

    if not settings.SENTRY_ENABLED:
        logger.info("Sentry error tracking is disabled (SENTRY_ENABLED=false)")
        return

    if not settings.SENTRY_DSN:
        logger.warning("Sentry DSN not configured. Skipping Sentry initialization.")
        return

    try:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT or settings.ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                StarletteIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
                RedisIntegration(),
                LoguruIntegration(),
            ],
            # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
            # Adjust this value in production to reduce overhead.
            send_default_pii=False,  # Don't send personally identifiable information
            attach_stacktrace=True,  # Attach stack traces to messages
            debug=settings.ENVIRONMENT
            == "local",  # Enable debug mode in local environment
            release=f"{settings.PROJECT_NAME}@1.0.0",  # Track releases
            before_send=before_send_sentry,  # Filter events before sending
        )
        logger.info(
            "Sentry initialized successfully",
            environment=settings.SENTRY_ENVIRONMENT or settings.ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        )
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def before_send_sentry(event, hint):
    """
    Filter and modify events before sending to Sentry.
    This is useful for:
    - Filtering out certain errors
    - Scrubbing sensitive data
    - Adding custom context
    """
    # Don't send health check errors
    if "request" in event:
        url = event.get("request", {}).get("url", "")
        if any(path in url for path in ["/health", "/metrics", "/docs", "/redoc"]):
            return None

    # Don't send 404 errors (too noisy)
    if "exception" in event:
        for exception in event["exception"].get("values", []):
            if exception.get("type") == "HTTPException":
                # Check if it's a 404
                if "404" in str(exception.get("value", "")):
                    return None

    return event


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting FastAPI application...")

    # Connect to database
    try:
        await database.connect()
        logger.info("Connected to database")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

    # Ensure required columns exist (backward-compatible safety)
    try:
        # Make sure users.is_system_user column exists
        await database.execute(
            """
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN NOT NULL DEFAULT false
            """
        )
        logger.info("Ensured users.is_system_user column exists")
    except Exception as e:
        logger.warning(f"Could not ensure schema compatibility: {e}")

    # Optionally initialize RBAC in any environment if explicitly enabled
    logger.info(
        f"RBAC bootstrap flag INIT_RBAC_ON_STARTUP={settings.INIT_RBAC_ON_STARTUP}"
    )
    # Connect to Redis cache
    try:
        await cache_manager.connect()
        logger.info("Connected to Redis cache")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis cache: {e}")

    # Connect to Redis for rate limiting
    try:
        await rate_limiter.connect()
        logger.info("Connected to Redis for rate limiting")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis for rate limiting: {e}")

    logger.info("Application startup complete")

    yield

    # Cleanup
    logger.info("Shutting down application...")

    try:
        await database.disconnect()
        logger.info("Disconnected from database")
    except Exception as e:
        logger.error(f"Error disconnecting from database: {e}")

    try:
        await cache_manager.disconnect()
        logger.info("Disconnected from Redis cache")
    except Exception as e:
        logger.error(f"Error disconnecting from Redis cache: {e}")

    try:
        await rate_limiter.disconnect()
        logger.info("Disconnected from Redis rate limiter")
    except Exception as e:
        logger.error(f"Error disconnecting from Redis rate limiter: {e}")

    logger.info("Application shutdown complete")


def create_application() -> FastAPI:
    """Create and configure FastAPI application"""

    # Initialize Sentry error tracking (before creating app)
    init_sentry()

    # Create FastAPI app
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Production-ready FastAPI boilerplate with security, RBAC, and comprehensive middleware",
        version="1.0.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # Setup CORS
    setup_cors(app)

    # Add trusted host middleware (should be first)
    if settings.ALLOWED_HOSTS and "*" not in settings.ALLOWED_HOSTS:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

    # Add security middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(ProxyHeadersMiddleware)
    app.add_middleware(RequestSizeMiddleware)
    app.add_middleware(RequestTimeoutMiddleware)

    # Add rate limiting middleware
    if settings.RATE_LIMIT_ENABLED:
        # Global per-client limiter
        app.add_middleware(RateLimitMiddleware)
        # Per-endpoint limiter
        if getattr(settings, "ENDPOINT_RATE_LIMIT_ENABLED", False):
            app.add_middleware(EndpointRateLimitMiddleware)

    # Add caching middleware
    app.add_middleware(ResponseCachingMiddleware, default_ttl=settings.CACHE_TTL)

    # Add logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Admin-specific middleware disabled for RBAC-only mode
    # app.add_middleware(AdminRateLimitMiddleware, requests_per_minute=30, enabled=True)

    # Add error handling middleware (should be last)
    app.add_middleware(ErrorHandlingMiddleware)

    # Add exception handlers for custom exceptions
    app.add_exception_handler(BusinessLogicError, business_logic_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(AuthenticationError, authentication_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(AuthorizationError, authorization_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(ResourceNotFoundError, resource_not_found_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(ConflictError, conflict_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(RateLimitError, rate_limit_error_handler)  # pyright: ignore[reportArgumentType]

    return app


# Create application instance
app = create_application()


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "FastAPI Boilerplate API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.is_development else None,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(office_mgnt_router, prefix=settings.API_V1_STR)
app.include_router(hostavailableroutes, prefix=settings.API_V1_STR)
app.include_router(appointment_router, prefix=settings.API_V1_STR)
