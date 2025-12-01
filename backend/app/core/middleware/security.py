"""
Security middleware for FastAPI application
"""

import time
from collections.abc import Callable

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import log_security_event

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        if settings.ENABLE_SECURITY_HEADERS:
            # Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), gyroscope=(), "
                "accelerometer=(), ambient-light-sensor=()"
            )

            # Add HSTS header for HTTPS
            if request.url.scheme == "https":
                response.headers["Strict-Transport-Security"] = (
                    "max-age=31536000; includeSubDomains; preload"
                )

            # Content Security Policy - Strict for production
            if request.url.scheme == "https" or not settings.is_development:
                # Production: Strict CSP without unsafe-inline
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; "
                    "script-src 'self' https://cdn.jsdelivr.net; "
                    "style-src 'self' https://cdn.jsdelivr.net; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' https://cdn.jsdelivr.net; "
                    "connect-src 'self'; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
            else:
                # Development: Allow unsafe-inline for Swagger UI
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' https://cdn.jsdelivr.net; "
                    "connect-src 'self'; "
                    "frame-ancestors 'none';"
                )

        return response


class TrustedHostMiddleware(BaseHTTPMiddleware):
    """Middleware to validate trusted hosts"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if settings.ALLOWED_HOSTS and "*" not in settings.ALLOWED_HOSTS:
            host = request.headers.get("host", "").split(":")[0]

            if host not in settings.ALLOWED_HOSTS:
                log_security_event(
                    event_type="untrusted_host",
                    severity="medium",
                    details={
                        "host": host,
                        "allowed_hosts": settings.ALLOWED_HOSTS,
                    },
                    ip_address=self._get_client_ip(request),
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid host header",
                )

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request size"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")

        if content_length:
            content_length = int(content_length)
            if content_length > settings.MAX_REQUEST_SIZE:
                log_security_event(
                    event_type="request_too_large",
                    severity="medium",
                    details={
                        "content_length": content_length,
                        "max_size": settings.MAX_REQUEST_SIZE,
                    },
                    ip_address=self._get_client_ip(request),
                )
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Request entity too large",
                )

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"


class RequestTimeoutMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce request timeouts"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        try:
            response = await call_next(request)

            # Check if request took too long
            duration = time.time() - start_time
            if duration > settings.REQUEST_TIMEOUT:
                log_security_event(
                    event_type="request_timeout",
                    severity="low",
                    details={
                        "duration": duration,
                        "timeout": settings.REQUEST_TIMEOUT,
                        "path": str(request.url.path),
                    },
                    ip_address=self._get_client_ip(request),
                )

            return response

        except Exception as e:
            duration = time.time() - start_time
            if duration > settings.REQUEST_TIMEOUT:
                log_security_event(
                    event_type="request_timeout_with_error",
                    severity="medium",
                    details={
                        "duration": duration,
                        "timeout": settings.REQUEST_TIMEOUT,
                        "path": str(request.url.path),
                        "error": str(e),
                    },
                    ip_address=self._get_client_ip(request),
                )
            raise

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to handle proxy headers securely"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only trust proxy headers from configured trusted proxies
        if settings.TRUSTED_PROXIES:
            client_ip = self._get_direct_client_ip(request)

            if client_ip not in settings.TRUSTED_PROXIES:
                # Remove proxy headers from untrusted sources
                headers_to_remove = [
                    "x-forwarded-for",
                    "x-forwarded-proto",
                    "x-forwarded-host",
                    "x-real-ip",
                ]

                for header in headers_to_remove:
                    if header in request.headers:
                        # Create new headers dict without the untrusted header
                        new_headers = dict(request.headers)
                        del new_headers[header]
                        request._headers = new_headers

                log_security_event(
                    event_type="untrusted_proxy_headers",
                    severity="low",
                    details={
                        "client_ip": client_ip,
                        "trusted_proxies": settings.TRUSTED_PROXIES,
                    },
                    ip_address=client_ip,
                )

        return await call_next(request)

    def _get_direct_client_ip(self, request: Request) -> str:
        """Get direct client IP without considering proxy headers"""
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"
