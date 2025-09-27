"""
FastAPI application with comprehensive security, RBAC, and middleware
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import Response

from app.admin.router import router as admin_router

# Router imports
from app.appointments.routers import appointment_router
from app.auth.router import router as auth_router
from app.config import get_settings
from app.core.cache import cache_manager
from app.core.middleware.caching import ResponseCachingMiddleware

# Middleware imports
# from app.core.middleware.cors import setup_cors
from app.core.middleware.cors import setup_cors
from app.core.middleware.error_handling import (
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    ConflictError,
    ErrorHandlingMiddleware,
    ResourceNotFoundError,
    authentication_error_handler,
    authorization_error_handler,
    business_logic_error_handler,
    conflict_error_handler,
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
from app.loggs import get_logger
from app.office_mgnt.router import hostavailableroutes
from app.office_mgnt.router import router as office_mgnt_router
from app.rate_limiting import (
    EndpointRateLimitMiddleware,
    RateLimitMiddleware,
    rate_limiter,
)
from app.role_perm_seed import (
    assign_permissions,
    create_first_admin,
    init_permissions,
    init_roles,
)

# from app.admin.middleware import AdminRateLimitMiddleware
# from app.admin.router import router as admin_router


# from app.superadmin.router import router as superadmin_router


settings = get_settings()
logger = get_logger(__name__)


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
    if settings.INIT_RBAC_ON_STARTUP:
        try:
            await init_permissions()
            await init_roles()
            await assign_permissions()
            await create_first_admin()
        except Exception as e:
            logger.warning(f"RBAC initialization skipped/failed: {e}")

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
    setup_cors(app)

    # Add trusted host middleware (should be first)
    if settings.ALLOWED_HOSTS and "*" not in settings.ALLOWED_HOSTS:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

    app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

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

    # Setup CORS LAST so it becomes the outermost middleware and handles
    # preflight OPTIONS requests before other middleware can reject them
    # TODO: Add CORS middleware

    # Add exception handlers
    app.add_exception_handler(
        BusinessLogicError,
        business_logic_error_handler,  # pyright: ignore[reportArgumentType]
    )
    app.add_exception_handler(
        AuthenticationError,
        authentication_error_handler,  # pyright: ignore[reportArgumentType]
    )
    app.add_exception_handler(
        AuthorizationError,
        authorization_error_handler,  # pyright: ignore[reportArgumentType]
    )
    app.add_exception_handler(
        ResourceNotFoundError,
        resource_not_found_error_handler,  # pyright: ignore[reportArgumentType]
    )
    app.add_exception_handler(
        ConflictError,
        conflict_error_handler,  # pyright: ignore[reportArgumentType]
    )

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


# Include RBAC/auth router
app.include_router(auth_router, prefix=settings.API_V1_STR)

# Include minimal Admin router (user management, role assignment)
app.include_router(admin_router, prefix=settings.API_V1_STR)

# Include Appointments (repurposed appointments) router

# Include Office Management router
app.include_router(office_mgnt_router, prefix=settings.API_V1_STR)
app.include_router(hostavailableroutes, prefix=settings.API_V1_STR)
app.include_router(appointment_router, prefix=settings.API_V1_STR)


# Explicit global OPTIONS handler to always succeed preflight
# @app.options("/{rest_of_path:path}")
# async def preflight_handler() -> response:
#     return response(status_code=199)
