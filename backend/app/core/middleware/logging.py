"""
Request logging middleware
"""
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import structured_logger, log_request

settings = get_settings()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests with structured data"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.REQUEST_LOGGING:
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Bind request context to logger
        request_id = structured_logger.bind_request(request)
        
        # Get request details
        method = request.method
        url = request.url
        user_agent = request.headers.get("user-agent")
        
        # Get client IP (considering proxies)
        ip_address = self._get_client_ip(request)
        
        # Get request size
        request_size = request.headers.get("content-length")
        if request_size:
            request_size = int(request_size)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Get response size
            response_size = response.headers.get("content-length")
            if response_size:
                response_size = int(response_size)
            
            # Log request
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
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate duration for failed requests
            duration = time.time() - start_time
            
            # Log failed request
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
            "x-client-ip",
        ]
        
        for header in forwarded_headers:
            if header in request.headers:
                # X-Forwarded-For can contain multiple IPs, take the first one
                ip = request.headers[header].split(",")[0].strip()
                if ip:
                    return ip
        
        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"
