"""
CSRF Protection for FastAPI application
"""

import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status
from loguru import logger

from app.config import get_settings
from app.core.cache import cache_manager

settings = get_settings()

CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_TTL = 3600  # 1 hour


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token"""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


async def store_csrf_token(token: str, session_id: str) -> bool:
    """Store CSRF token in cache with TTL"""
    try:
        key = f"csrf:token:{session_id}"
        return await cache_manager.set(key, token, ttl=CSRF_TOKEN_TTL)
    except Exception as e:
        logger.error(f"Failed to store CSRF token: {e}")
        return False


async def verify_csrf_token(token: str, session_id: str) -> bool:
    """Verify CSRF token from cache"""
    if not token or not session_id:
        return False

    try:
        key = f"csrf:token:{session_id}"
        stored_token = await cache_manager.get(key)
        if not stored_token:
            logger.warning(f"CSRF token not found for session: {session_id}")
            return False

        # Constant-time comparison to prevent timing attacks
        return secrets.compare_digest(token, stored_token)
    except Exception as e:
        logger.error(f"CSRF token verification failed: {e}")
        return False


async def validate_csrf_token(request: Request, session_id: str) -> None:
    """Validate CSRF token from request headers or form data"""
    # Skip CSRF check for safe methods
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return

    # Get CSRF token from headers (preferred) or form data
    token = request.headers.get("X-CSRF-Token")

    if not token:
        try:
            form_data = await request.form()
            token = form_data.get("csrf_token")
        except Exception:
            pass

    if not token:
        logger.warning(f"CSRF token missing for {request.method} {request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )

    # Verify token
    is_valid = await verify_csrf_token(token, session_id)
    if not is_valid:
        logger.warning(f"CSRF token invalid for session: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid",
        )

