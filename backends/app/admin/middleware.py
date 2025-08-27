"""
Admin module middleware for request logging and audit
"""
import time
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional, Dict, Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.database import database


from app.admin.config import AdminAuditConfig
from app.admin.utils import mask_sensitive_data







class AdminRateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware specifically for admin endpoints"""

    def __init__(self, app, requests_per_minute: int = 60, enabled: bool = True):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.enabled = enabled
        self.request_counts: Dict[str, Dict[str, Any]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled:
            return await call_next(request)

        # Only apply to admin endpoints
        if not request.url.path.startswith("/api/v1/admin"):
            return await call_next(request)

        # Get client identifier
        client_id = self._get_client_id(request)

        # Check rate limit
        if self._is_rate_limited(client_id):
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "type": "rate_limit_exceeded",
                        "message": f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                        "details": {
                            "limit": self.requests_per_minute,
                            "window": "1 minute"
                        }
                    }
                }
            )

        # Record request
        self._record_request(client_id)

        return await call_next(request)

    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""

        # Try to get user ID from request state
        if hasattr(request.state, "user") and hasattr(request.state.user, "id"):
            return f"user:{request.state.user.id}"

        # Fall back to IP address
        if request.client:
            return f"ip:{request.client.host}"

        return "unknown"

    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited"""

        now = time.time()
        window_start = now - 60  # 1 minute window

        if client_id not in self.request_counts:
            return False

        client_data = self.request_counts[client_id]

        # Clean old requests
        client_data["requests"] = [
            req_time for req_time in client_data["requests"]
            if req_time > window_start
        ]

        return len(client_data["requests"]) >= self.requests_per_minute

    def _record_request(self, client_id: str):
        """Record request for rate limiting"""

        now = time.time()

        if client_id not in self.request_counts:
            self.request_counts[client_id] = {"requests": []}

        self.request_counts[client_id]["requests"].append(now)

        # Clean old data periodically
        if len(self.request_counts) > 1000:
            self._cleanup_old_data()

    def _cleanup_old_data(self):
        """Clean up old rate limiting data"""

        now = time.time()
        window_start = now - 60

        clients_to_remove = []

        for client_id, client_data in self.request_counts.items():
            client_data["requests"] = [
                req_time for req_time in client_data["requests"]
                if req_time > window_start
            ]

            if not client_data["requests"]:
                clients_to_remove.append(client_id)

        for client_id in clients_to_remove:
            del self.request_counts[client_id]
