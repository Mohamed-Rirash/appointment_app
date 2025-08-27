"""
CORS middleware configuration for FastAPI application
"""
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()


def setup_cors(app):
    """Setup CORS middleware with proper configuration"""

    # Get allowed origins
    allowed_origins = settings.BACKEND_CORS_ORIGINS
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=settings.USE_CREDENTIALS,
        allow_methods=[
            "DELETE",
            "GET", 
            "POST",
            "PUT",
            "PATCH",
            "OPTIONS"
        ],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Request-ID",
            "X-API-Key",
            "Cache-Control",
            "Pragma"
        ],
        expose_headers=[
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Window",
            "Retry-After"
        ],
        max_age=86400  # 24 hours
    )


def get_cors_config():
    """Get CORS configuration for manual setup"""
    return {
        "allow_origins": settings.all_cors_origins,
        "allow_credentials": settings.USE_CREDENTIALS,
        "allow_methods": [
            "DELETE",
            "GET", 
            "POST",
            "PUT",
            "PATCH",
            "OPTIONS"
        ],
        "allow_headers": [
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-Request-ID",
            "X-API-Key",
            "Cache-Control",
            "Pragma"
        ],
        "expose_headers": [
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Window",
            "Retry-After"
        ],
        "max_age": 86400
    }
