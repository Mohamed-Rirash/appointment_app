"""
Response caching middleware for FastAPI application
"""
import hashlib
import json
import asyncio
from typing import Callable, Optional, Set, Dict, Any, List
from datetime import timedelta

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.cache import cache_manager
from app.config import get_settings
from app.loggs import log_cache_event

settings = get_settings()


class ResponseCachingMiddleware(BaseHTTPMiddleware):
    """Middleware for caching HTTP responses"""
    
    def __init__(
        self,
        app,
        default_ttl: int = 300,  # 5 minutes
        cacheable_methods: Set[str] = None,
        cacheable_status_codes: Set[int] = None,
        cache_private: bool = False,
        respect_decorator: bool = True,
    ):
        super().__init__(app)
        self.default_ttl = default_ttl
        self.cacheable_methods = cacheable_methods or {"GET", "HEAD"}
        self.cacheable_status_codes = cacheable_status_codes or {200, 201, 202, 203, 204, 300, 301, 302, 303, 304, 307, 308, 410}
        self.cache_private = cache_private
        self.respect_decorator = respect_decorator
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only cache if method is cacheable
        if request.method not in self.cacheable_methods:
            return await call_next(request)
        
        # Resolve route-specific cache config if present
        route_cfg = self._get_route_cache_config(request)

        # Two-phase key: derive base key (no headers), get vary headers (from meta), then final key
        base_key = self._generate_cache_key(request, route_cfg, vary_headers=[])
        vary_headers = await self._load_vary_headers(base_key)
        cache_key = self._generate_cache_key(request, route_cfg, vary_headers=vary_headers)
        
        # Try to get cached response
        cached_response = await cache_manager.get(cache_key)
        if cached_response:
            # Handle conditional GET using If-None-Match/ETag
            inm = request.headers.get("if-none-match")
            etag = None
            try:
                etag = cached_response.get("headers", {}).get("ETag")
            except Exception:
                etag = None
            if inm and etag and inm.strip() == etag:
                resp_304 = Response(status_code=304)
                # propagate cache-relevant headers
                for hk, hv in cached_response.get("headers", {}).items():
                    if hk.lower() in {"cache-control", "expires", "etag", "vary"}:
                        resp_304.headers[hk] = hv
                resp_304.headers["X-Cache"] = "HIT"
                log_cache_event("get", cache_key, hit=True)
                return resp_304
            log_cache_event("get", cache_key, hit=True)
            return self._create_response_from_cache(cached_response)
        
        log_cache_event("get", cache_key, hit=False)
        
        # Process request (with single-flight lock to mitigate stampede)
        acquired = await cache_manager.acquire_lock(cache_key, ttl_seconds=5)
        if not acquired:
            # Another worker is populating; wait briefly for it
            for _ in range(20):  # ~1s total
                await asyncio.sleep(0.05)
                cached_response = await cache_manager.get(cache_key)
                if cached_response:
                    log_cache_event("get", cache_key, hit=True)
                    return self._create_response_from_cache(cached_response)
            # Fallback: continue without caching
        response = await call_next(request)
        
        # Cache response if cacheable
        if self._is_cacheable_response(request, response, route_cfg):
            ttl = self._get_cache_ttl(response, route_cfg)
            if ttl > 0:
                cached_data, raw_body_bytes = await self._serialize_response(response)
                # Determine Vary headers and persist them in meta for future keys
                vary_list = self._extract_vary_headers(response, route_cfg)
                await self._store_vary_headers(base_key, vary_list, ttl)
                # Add ETag header for validation support (sha256 over raw bytes)
                etag = self._compute_etag_bytes(raw_body_bytes)
                if etag:
                    response.headers["ETag"] = etag
                    cached_data["headers"]["ETag"] = etag
                await cache_manager.set(cache_key, cached_data, ttl)
                log_cache_event("set", cache_key, size=len(str(cached_data)))
        # Release lock if we acquired it
        try:
            await cache_manager.release_lock(cache_key)
        except Exception:
            pass
        else:
            # Explicitly mark as MISS for observability
            try:
                response.headers["X-Cache"] = "MISS"
            except Exception:
                pass
        
        return response
    
    def _get_route_cache_config(self, request: Request) -> Dict[str, Any]:
        """Extract cache config from endpoint decorator if available."""
        if not self.respect_decorator:
            return {}
        endpoint = request.scope.get("endpoint")
        if not endpoint:
            return {}
        cfg = getattr(endpoint, "_cache_config", None)
        return cfg or {}

    def _generate_cache_key(self, request: Request, route_cfg: Dict[str, Any], vary_headers: List[str]) -> str:
        """Generate a cache key for the request"""
        # Include method, path, and query parameters
        key_prefix = route_cfg.get("key_prefix") if route_cfg else None
        key_parts = [key_prefix or "response", request.method, str(request.url.path), str(request.url.query)]
        
        # Vary on user if requested by route config or when caching private
        vary_on_user = route_cfg.get("vary_on_user") if route_cfg else False
        if (vary_on_user or self.cache_private) and hasattr(request.state, "user_id"):
            key_parts.append(f"user:{request.state.user_id}")
        
        # Include relevant headers from global defaults, per-route, and persisted Vary
        relevant_headers = ["accept", "accept-language", "accept-encoding"]
        vary_on_headers = route_cfg.get("vary_on_headers") if route_cfg else []
        for h in vary_on_headers:
            if h.lower() not in relevant_headers:
                relevant_headers.append(h.lower())
        for h in vary_headers:
            if h.lower() not in relevant_headers:
                relevant_headers.append(h.lower())
        
        for header in relevant_headers:
            if header in request.headers:
                key_parts.append(f"{header}:{request.headers[header]}")
        
        # Create hash of key parts
        key_string = "|".join(key_parts)
        cache_key = hashlib.md5(key_string.encode()).hexdigest()
        
        return f"response:{cache_key}"
    
    def _is_cacheable_response(self, request: Request, response: Response, route_cfg: Dict[str, Any]) -> bool:
        """Check if response should be cached"""
        # Check status code
        if response.status_code not in self.cacheable_status_codes:
            return False
        
        # Check cache-control headers
        cache_control = response.headers.get("cache-control", "").lower()
        if "no-cache" in cache_control or "no-store" in cache_control:
            return False
        
        # Don't cache private responses unless explicitly allowed
        if not self.cache_private and "private" in cache_control:
            return False
        
        # Don't cache responses with set-cookie headers
        if response.headers.get("set-cookie") is not None:
            return False

        # Avoid caching Authorization-bound requests unless we vary on user
        vary_on_user = route_cfg.get("vary_on_user") if route_cfg else False
        if request.headers.get("authorization") and not (vary_on_user or self.cache_private):
            return False
        
        return True
    
    def _get_cache_ttl(self, response: Response, route_cfg: Dict[str, Any]) -> int:
        """Get cache TTL from response headers or use default"""
        cache_control = response.headers.get("cache-control", "")
        
        # Look for max-age directive
        for directive in cache_control.split(","):
            directive = directive.strip()
            if directive.startswith("max-age="):
                try:
                    return int(directive.split("=")[1])
                except (ValueError, IndexError):
                    pass
        
        # Check expires header
        expires = response.headers.get("expires")
        if expires:
            try:
                from email.utils import parsedate_to_datetime
                expires_dt = parsedate_to_datetime(expires)
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                ttl = int((expires_dt - now).total_seconds())
                return max(0, ttl)
            except Exception:
                pass
        
        # Respect decorator ttl if present
        if route_cfg and route_cfg.get("ttl") is not None:
            try:
                return int(route_cfg["ttl"])
            except Exception:
                pass
        return self.default_ttl
    
    async def _serialize_response(self, response: Response) -> tuple[dict, bytes]:
        """Serialize response for caching and return raw bytes too"""
        # Read response body
        body = b""
        body_chunks = []
        async for chunk in response.body_iterator:
            body += chunk
            body_chunks.append(chunk)

        # Recreate the response body iterator so the original response isn't empty
        async def recreate_body_iterator():
            for chunk in body_chunks:
                yield chunk

        response.body_iterator = recreate_body_iterator()

        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": body.decode("utf-8", errors="ignore"),
            "media_type": response.media_type
        }, body
    
    def _create_response_from_cache(self, cached_data: dict) -> Response:
        """Create response from cached data"""
        response = Response(
            content=cached_data["body"],
            status_code=cached_data["status_code"],
            media_type=cached_data.get("media_type")
        )
        
        # Restore only a safe allowlist of headers
        allowlist = {
            "cache-control",
            "expires",
            "etag",
            "vary",
            "content-type",
            "content-language",
            "content-encoding",
        }
        for key, value in cached_data["headers"].items():
            if key.lower() in allowlist:
                response.headers[key] = value
        
        # Add cache hit header
        response.headers["X-Cache"] = "HIT"
        
        return response

    def _compute_etag_bytes(self, raw_bytes: bytes) -> Optional[str]:
        try:
            import hashlib as _hl
            return _hl.sha256(raw_bytes).hexdigest()
        except Exception:
            return None

    def _extract_vary_headers(self, response: Response, route_cfg: Dict[str, Any]) -> List[str]:
        # Combine decorator-provided varies with response Vary header
        varies = []
        vary_on_headers = route_cfg.get("vary_on_headers") if route_cfg else []
        varies.extend([h.lower() for h in (vary_on_headers or [])])
        vary_hdr = response.headers.get("Vary") or response.headers.get("vary")
        if vary_hdr:
            for part in vary_hdr.split(","):
                h = part.strip().lower()
                if h and h not in varies:
                    varies.append(h)
        # Always include defaults already handled elsewhere; no need to add here
        return varies

    async def _store_vary_headers(self, base_key: str, vary_headers: List[str], ttl: int) -> None:
        try:
            meta_key = f"{base_key}:meta"
            await cache_manager.set(meta_key, {"vary": vary_headers}, ttl)
        except Exception:
            pass

    async def _load_vary_headers(self, base_key: str) -> List[str]:
        try:
            meta_key = f"{base_key}:meta"
            meta = await cache_manager.get(meta_key)
            if isinstance(meta, dict) and "vary" in meta and isinstance(meta["vary"], list):
                return [str(h).lower() for h in meta["vary"]]
        except Exception:
            pass
        return []


def cache_response(
    ttl: Optional[int] = None,
    key_prefix: Optional[str] = None,
    vary_on_user: bool = False,
    vary_on_headers: Optional[list[str]] = None
):
    """
    Decorator for caching endpoint responses
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        vary_on_user: Include user ID in cache key
        vary_on_headers: List of headers to include in cache key
    """
    def decorator(func):
        func._cache_config = {
            "ttl": ttl or settings.CACHE_TTL,
            "key_prefix": key_prefix or func.__name__,
            "vary_on_user": vary_on_user,
            "vary_on_headers": vary_on_headers or []
        }
        return func
    return decorator


async def invalidate_response_cache(pattern: str):
    """Invalidate cached responses matching a pattern"""
    full_pattern = f"response:*{pattern}*"
    count = await cache_manager.delete_pattern(full_pattern)
    log_cache_event("invalidate", pattern, size=count)
    return count


async def clear_all_response_cache():
    """Clear all cached responses"""
    count = await cache_manager.delete_pattern("response:*")
    log_cache_event("clear_all", "response", size=count)
    return count
