"""
Request logging middleware with Loguru integration
"""
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import structured_logger, log_request, get_logger

settings = get_settings()
logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests with structured data using Loguru"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for health check and metrics endpoints
        if request.url.path in ["/health", "/metrics", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        if not settings.REQUEST_LOGGING:
            return await call_next(request)

        # Start timing
        start_time = time.time()

        # Bind request context to logger
        request_id = structured_logger.bind_request(request)

        # Get request details
        method = request.method
        url = str(request.url)
        path = request.url.path
        user_agent = request.headers.get("user-agent", "unknown")

        # Get client IP (considering proxies)
        ip_address = self._get_client_ip(request)

        # Get request size
        request_size = request.headers.get("content-length")
        if request_size:
            try:
                request_size = int(request_size)
            except (ValueError, TypeError):
                request_size = None

        # Get user ID if available
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = str(getattr(request.state.user, "id", None))

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Get response size
            response_size = response.headers.get("content-length")
            if response_size:
                try:
                    response_size = int(response_size)
                except (ValueError, TypeError):
                    response_size = None

            # Log request with structured data
            log_request(
                method=method,
                url=url,
                status_code=response.status_code,
                duration=duration,
                request_size=request_size,
                response_size=response_size,
                user_agent=user_agent,
                ip_address=ip_address
            )

            # Add request ID to response headers for tracing
            response.headers["X-Request-ID"] = request_id

            # Log additional context for slow requests
            if duration > 1.0:  # Log slow requests (> 1 second)
                logger.warning(
                    f"Slow request detected",
                    path=path,
                    method=method,
                    duration_ms=round(duration * 1000, 2),
                    status_code=response.status_code,
                    user_id=user_id
                )

            return response

        except Exception as e:
            # Calculate duration for failed requests
            duration = time.time() - start_time

            # Log failed request with error details
            logger.error(
                f"Request failed with exception",
                path=path,
                method=method,
                duration_ms=round(duration * 1000, 2),
                error=str(e),
                error_type=type(e).__name__,
                ip_address=ip_address,
                user_id=user_id
            )

            # Also log using the standard log_request function
            log_request(
                method=method,
                url=url,
                status_code=500,
                duration=duration,
                request_size=request_size,
                user_agent=user_agent,
                ip_address=ip_address
            )

            raise

        finally:
            # Clear request context
            structured_logger.clear_context()

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address considering proxy headers"""
        # Check for forwarded headers (in order of preference)
        forwarded_headers = [
            "x-forwarded-for",
            "x-real-ip",
            "cf-connecting-ip",  # Cloudflare
            "true-client-ip",    # Cloudflare Enterprise
            "x-client-ip",
        ]

        for header in forwarded_headers:
            if header in request.headers:
                # X-Forwarded-For can contain multiple IPs, take the first one (client IP)
                ip = request.headers[header].split(",")[0].strip()
                if ip and ip != "unknown":
                    return ip

        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host

        return "unknown"
