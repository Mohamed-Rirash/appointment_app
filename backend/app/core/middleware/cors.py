"""
CORS middleware configuration for FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with proper configuration"""

    # Ensure list of allowed origins are plain strings
    configured_origins = settings.BACKEND_CORS_ORIGINS
    allowed_origins = [str(o) for o in (configured_origins or [])]
    # Always include explicit frontend host if provided
    if getattr(settings, "FRONTEND_HOST", None):
        fh = str(settings.FRONTEND_HOST)
        if fh and fh not in allowed_origins:
            allowed_origins.append(fh)

    # If no origins configured (e.g., env var set to empty), default to local dev
    if not allowed_origins:
        allowed_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    # Add common local dev aliases if applicable
    if (
        "http://localhost:3000" in allowed_origins
        and "http://127.0.0.1:3000" not in allowed_origins
    ):
        allowed_origins.append("http://127.0.0.1:3000")
    if (
        "http://127.0.0.1:3000" in allowed_origins
        and "http://localhost:3000" not in allowed_origins
    ):
        allowed_origins.append("http://localhost:3000")

    # Explicit list of allowed headers
    allowed_headers = [
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-ID",
        "X-API-Key",
        "X-CSRF-Token",
        "Cache-Control",
        "Pragma",
    ]

    # In local/dev, allow credentials for cross-site cookie refresh flow
    if settings.is_development:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=allowed_headers,
            expose_headers=[
                "X-Request-ID",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Window",
                "Retry-After",
                "X-CSRF-Token",
            ],
            max_age=3600,  # 1 hour
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=settings.USE_CREDENTIALS,
            # Explicitly list common methods including OPTIONS for preflight
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=allowed_headers,  # Explicit headers instead of "*"
            expose_headers=[
                "X-Request-ID",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Window",
                "Retry-After",
                "X-CSRF-Token",
            ],
            max_age=3600,  # 1 hour instead of 24 hours
        )


def get_cors_config():
    """Get CORS configuration for manual setup"""
    return {
        "allow_origins": settings.BACKEND_CORS_ORIGINS,
        "allow_credentials": settings.USE_CREDENTIALS,
        "allow_methods": ["DELETE", "GET", "POST", "PUT", "PATCH", "OPTIONS"],
        "allow_headers": [
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Request-ID",
            "X-API-Key",
            "X-CSRF-Token",
            "Cache-Control",
            "Pragma",
        ],
        "expose_headers": [
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Window",
            "Retry-After",
            "X-CSRF-Token",
        ],
        "max_age": 86400,
    }
