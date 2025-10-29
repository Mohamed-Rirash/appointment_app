import time
import uuid
from collections.abc import Callable
from functools import wraps

import redis.asyncio as redis
from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import log_security_event

settings = get_settings()


class RateLimiter:
    """Redis-based rate limiter"""

    def __init__(self):
        self._redis: redis.Redis | None = None
        self._connected = False

    async def connect(self):
        """Connect to Redis for rate limiting"""
        if not settings.RATE_LIMIT_ENABLED:
            return

        try:
            # Build Redis URL if not provided
            redis_url = settings.RATE_LIMIT_STORAGE_URL
            if not redis_url:
                redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}"
                if settings.REDIS_PASSWORD:
                    redis_url = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}"

            self._redis = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            await self._redis.ping()
            self._connected = True
        except Exception:
            self._connected = False
            # Rate limiting will be disabled if Redis is not available

    async def disconnect(self):
        """Disconnect from Redis"""
        if self._redis:
            await self._redis.close()
            self._connected = False

    async def is_allowed(
        self, key: str, limit: int, window: int, cost: int = 1
    ) -> tuple[bool, dict]:
        """
        Check if request is allowed based on rate limit

        Args:
            key: Unique identifier for the rate limit (e.g., IP, user ID)
            limit: Maximum number of requests allowed
            window: Time window in seconds
            cost: Cost of this request (default 1)

        Returns:
            Tuple of (is_allowed, info_dict)
        """
        if not self._connected or not settings.RATE_LIMIT_ENABLED:
            return True, {}

        try:
            current_time = int(time.time())
            window_start = current_time - window

            # Use sliding window log algorithm
            pipe = self._redis.pipeline()

            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)

            # Add current request as a unique member to avoid collisions within the same second
            member_id = f"{current_time}:{uuid.uuid4().hex}"
            pipe.zadd(key, {member_id: current_time})

            # Count current requests AFTER insertion
            pipe.zcard(key)

            # Set expiration
            pipe.expire(key, window)

            results = await pipe.execute()
            current_requests = results[2]

            # Check if limit exceeded (apply cost)
            # Allow exactly `limit` requests within the window; reject only when it would exceed
            if current_requests + (cost - 1) > limit:
                # Remove the member we just added to not overcount
                try:
                    await self._redis.zrem(key, member_id)
                except Exception:
                    pass

                return False, {
                    "limit": limit,
                    "window": window,
                    # When rejected, usage is effectively capped at the limit for clients
                    "current": limit,
                    "retry_after": window,
                }

            # Allowed
            # Cap used at limit for consistent header semantics and compute remaining accordingly
            used = min(current_requests, limit)
            remaining = max(0, limit - used)
            return True, {
                "limit": limit,
                "window": window,
                "current": used,
                "remaining": remaining,
            }

        except Exception:
            # If Redis fails, allow the request (fail open)
            return True, {}

    async def get_usage(self, key: str, window: int) -> int:
        """Get current usage for a key"""
        if not self._connected:
            return 0

        try:
            current_time = int(time.time())
            window_start = current_time - window
            return await self._redis.zcount(key, window_start, current_time)
        except Exception:
            return 0


# Global rate limiter instance
rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for global rate limiting"""

    async def dispatch(self, request: Request, call_next: Callable):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Get client identifier
        client_id = self._get_client_identifier(request)

        # Check rate limit
        allowed, info = await rate_limiter.is_allowed(
            key=f"global:{client_id}",
            limit=settings.RATE_LIMIT_REQUESTS,
            window=settings.RATE_LIMIT_WINDOW,
        )

        if not allowed:
            # Log rate limit exceeded
            log_security_event(
                event_type="rate_limit_exceeded",
                severity="medium",
                details={
                    "client_id": client_id,
                    "limit": info.get("limit"),
                    "window": info.get("window"),
                    "current": info.get("current"),
                },
                ip_address=self._get_client_ip(request),
            )

            # Return rate limit error
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(info.get("limit", 0)),
                    "X-RateLimit-Window": str(info.get("window", 0)),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(info.get("retry_after", 60)),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        if info:
            response.headers["X-RateLimit-Limit"] = str(info.get("limit", 0))
            response.headers["X-RateLimit-Window"] = str(info.get("window", 0))
            response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", 0))

        return response

    def _get_client_identifier(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get user ID from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"

        # Fall back to IP address
        return f"ip:{self._get_client_ip(request)}"

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if hasattr(request, "client") and request.client:
            return request.client.host

        return "unknown"


class EndpointRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for per-endpoint rate limiting"""

    async def dispatch(self, request: Request, call_next: Callable):
        if not settings.ENDPOINT_RATE_LIMIT_ENABLED or not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Exempt common lightweight or public endpoints
        path = request.url.path
        if (
            path in {"/", "/health", "/openapi.json"}
            or path.startswith("/docs")
            or path.startswith("/redoc")
            or path.startswith("/static")
        ):
            return await call_next(request)

        # Resolve route template if available to avoid path param cardinality
        route_path = path
        try:
            route = request.scope.get("route")
            if route and getattr(route, "path", None):
                route_path = route.path
        except Exception:
            pass

        # Identify client
        client_id = self._get_client_identifier(request)

        # Build endpoint key
        endpoint_key = f"{request.method}:{route_path}"

        # Check rate limit for this endpoint and client
        allowed, info = await rate_limiter.is_allowed(
            key=f"endpoint:{endpoint_key}:{client_id}",
            limit=settings.ENDPOINT_RATE_LIMIT_REQUESTS,
            window=settings.ENDPOINT_RATE_LIMIT_WINDOW,
        )

        if not allowed:
            # Log and block
            log_security_event(
                event_type="endpoint_rate_limit_exceeded",
                severity="medium",
                details={
                    "endpoint": endpoint_key,
                    "client_id": client_id,
                    "limit": info.get("limit"),
                    "window": info.get("window"),
                    "current": info.get("current"),
                },
                ip_address=self._get_client_ip(request),
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {endpoint_key}",
                headers={
                    "X-RateLimit-Limit": str(info.get("limit", 0)),
                    "X-RateLimit-Window": str(info.get("window", 0)),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(
                        info.get("retry_after", settings.ENDPOINT_RATE_LIMIT_WINDOW)
                    ),
                },
            )

        # Proceed and attach headers
        response = await call_next(request)
        if info:
            response.headers.setdefault(
                "X-EndpointRateLimit-Limit", str(info.get("limit", 0))
            )
            response.headers.setdefault(
                "X-EndpointRateLimit-Window", str(info.get("window", 0))
            )
            response.headers.setdefault(
                "X-EndpointRateLimit-Remaining", str(info.get("remaining", 0))
            )
        return response

    def _get_client_identifier(self, request: Request) -> str:
        # Prefer authenticated user id if available
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        return f"ip:{self._get_client_ip(request)}"

    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"


def rate_limit(
    requests: int,
    window: int,
    per: str = "ip",
    cost: int = 1,
    key_func: Callable | None = None,
):
    """
    Decorator for endpoint-specific rate limiting

    Args:
        requests: Number of requests allowed
        window: Time window in seconds
        per: Rate limit per what ("ip", "user", or custom)
        cost: Cost of this request
        key_func: Custom function to generate rate limit key
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find request object in args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                # If no request found, skip rate limiting
                return await func(*args, **kwargs)

            # Generate rate limit key
            if key_func:
                key = key_func(request)
            elif per == "user":
                if hasattr(request.state, "user_id"):
                    key = f"endpoint:{func.__name__}:user:{request.state.user_id}"
                else:
                    # Fall back to IP if user not authenticated
                    key = f"endpoint:{func.__name__}:ip:{_get_client_ip(request)}"
            elif per == "ip":
                key = f"endpoint:{func.__name__}:ip:{_get_client_ip(request)}"
            else:
                key = f"endpoint:{func.__name__}:{per}"

            # Check rate limit
            allowed, info = await rate_limiter.is_allowed(
                key=key, limit=requests, window=window, cost=cost
            )

            if not allowed:
                log_security_event(
                    event_type="endpoint_rate_limit_exceeded",
                    severity="medium",
                    details={
                        "endpoint": func.__name__,
                        "key": key,
                        "limit": info.get("limit"),
                        "window": info.get("window"),
                    },
                    ip_address=_get_client_ip(request),
                )

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for {func.__name__}",
                    headers={
                        "X-RateLimit-Limit": str(info.get("limit", 0)),
                        "X-RateLimit-Window": str(info.get("window", 0)),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": str(info.get("retry_after", window)),
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def _get_client_ip(request: Request) -> str:
    """Helper function to get client IP"""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if hasattr(request, "client") and request.client:
        return request.client.host

    return "unknown"


# Dependency for getting rate limit info
async def get_rate_limit_info(request: Request) -> dict:
    """Dependency to get current rate limit information"""
    client_id = f"ip:{_get_client_ip(request)}"
    if hasattr(request.state, "user_id"):
        client_id = f"user:{request.state.user_id}"

    usage = await rate_limiter.get_usage(
        key=f"global:{client_id}", window=settings.RATE_LIMIT_WINDOW
    )

    return {
        "limit": settings.RATE_LIMIT_REQUESTS,
        "window": settings.RATE_LIMIT_WINDOW,
        "current": usage,
        "remaining": max(0, settings.RATE_LIMIT_REQUESTS - usage),
    }
