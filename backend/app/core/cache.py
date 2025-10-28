import json
import pickle
from collections.abc import Callable
from datetime import timedelta
from functools import wraps
from typing import Any

import redis.asyncio as redis
from loguru import logger

from app.config import get_settings

settings = get_settings()


class CacheManager:
    """Redis cache manager with async support"""

    def __init__(self):
        self._redis: redis.Redis | None = None
        self._connected = False

    async def connect(self):
        """Connect to Redis"""
        try:
            # Build Redis URL from settings
            redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
            if settings.REDIS_PASSWORD:
                redis_url = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

            self._redis = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Test connection
            await self._redis.ping()
            self._connected = True
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False
            raise

    async def disconnect(self):
        """Disconnect from Redis"""
        if self._redis:
            await self._redis.close()
            self._connected = False
            logger.info("Disconnected from Redis cache")

    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self._connected and self._redis is not None

    def _make_key(self, key: str) -> str:
        """Create a prefixed cache key"""
        return f"{settings.CACHE_PREFIX}:{key}"

    async def get(self, key: str) -> Any | None:
        """Get a value from cache"""
        if not self.is_connected:
            return None

        try:
            prefixed_key = self._make_key(key)
            value = await self._redis.get(prefixed_key)
            if value is None:
                return None

            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                try:
                    return pickle.loads(value.encode("latin1"))
                except Exception:
                    return value

        except Exception as e:
            logger.warning(f"Cache get failed for key {key}: {e}")
            return None

    async def set(
        self, key: str, value: Any, ttl: int | timedelta | None = None
    ) -> bool:
        """Set a value in cache"""
        if not self.is_connected:
            return False

        try:
            prefixed_key = self._make_key(key)

            # Serialize value
            try:
                serialized_value = json.dumps(value)
            except (TypeError, ValueError):
                # Fall back to pickle for complex objects
                serialized_value = pickle.dumps(value).decode("latin1")

            # Set TTL
            if ttl is None:
                ttl = settings.CACHE_TTL
            elif isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())

            await self._redis.setex(prefixed_key, ttl, serialized_value)
            return True

        except Exception as e:
            logger.warning(f"Cache set failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        if not self.is_connected:
            return False

        try:
            prefixed_key = self._make_key(key)
            result = await self._redis.delete(prefixed_key)
            return result > 0
        except Exception as e:
            logger.warning(f"Cache delete failed for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete keys matching a pattern using SCAN to avoid blocking Redis."""
        if not self.is_connected:
            return 0
        try:
            prefixed_pattern = self._make_key(pattern)
            cursor = 0
            total_deleted = 0
            while True:
                cursor, keys = await self._redis.scan(
                    cursor=cursor, match=prefixed_pattern, count=100
                )
                if keys:
                    total_deleted += await self._redis.delete(*keys)
                if cursor == 0:
                    break
            return total_deleted
        except Exception as e:
            logger.warning(f"Cache pattern delete failed for pattern {pattern}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if a key exists in cache"""
        if not self.is_connected:
            return False

        try:
            prefixed_key = self._make_key(key)
            return await self._redis.exists(prefixed_key) > 0
        except Exception as e:
            logger.warning(f"Cache exists check failed for key {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> int | None:
        """Increment a numeric value in cache"""
        if not self.is_connected:
            return None

        try:
            prefixed_key = self._make_key(key)
            return await self._redis.incrby(prefixed_key, amount)
        except Exception as e:
            logger.warning(f"Cache increment failed for key {key}: {e}")
            return None

    async def expire(self, key: str, ttl: int | timedelta) -> bool:
        """Set expiration for a key"""
        if not self.is_connected:
            return False

        try:
            prefixed_key = self._make_key(key)
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())
            return await self._redis.expire(prefixed_key, ttl)
        except Exception as e:
            logger.warning(f"Cache expire failed for key {key}: {e}")
            return False

    async def clear_all(self) -> bool:
        """Clear all cache entries with the app prefix"""
        if not self.is_connected:
            return False

        try:
            pattern = f"{settings.CACHE_PREFIX}:*"
            cursor = 0
            total = 0
            while True:
                cursor, keys = await self._redis.scan(
                    cursor=cursor, match=pattern, count=200
                )
                if keys:
                    total += await self._redis.delete(*keys)
                if cursor == 0:
                    break
            logger.info(f"Cleared {total} cache entries")
            return True
        except Exception as e:
            logger.error(f"Cache clear all failed: {e}")
            return False

    async def acquire_lock(self, key: str, ttl_seconds: int = 5) -> bool:
        """Acquire a single-flight lock for a cache key."""
        if not self.is_connected:
            return True  # fail-open, allow processing
        try:
            lock_key = self._make_key(f"lock:{key}")
            # SET NX EX
            return await self._redis.set(lock_key, "1", ex=ttl_seconds, nx=True) is True
        except Exception as e:
            logger.warning(f"Cache acquire_lock failed for key {key}: {e}")
            return True

    async def release_lock(self, key: str) -> None:
        """Release a previously acquired single-flight lock."""
        if not self.is_connected:
            return
        try:
            lock_key = self._make_key(f"lock:{key}")
            await self._redis.delete(lock_key)
        except Exception as e:
            logger.warning(f"Cache release_lock failed for key {key}: {e}")


# Global cache manager instance
cache_manager = CacheManager()


def cache(
    key_prefix: str,
    ttl: int | timedelta | None = None,
    key_builder: Callable | None = None,
):
    """
    Decorator for caching function results

    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live for cached value
        key_builder: Custom function to build cache key from function args
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
            else:
                # Default key building from function name and args
                args_str = "_".join(str(arg) for arg in args)
                kwargs_str = "_".join(f"{k}={v}" for k, v in kwargs.items())
                cache_key = f"{key_prefix}:{func.__name__}:{args_str}:{kwargs_str}"

            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            return result

        return wrapper

    return decorator


def cache_key_for_user(user_id: str | int, suffix: str = "") -> str:
    """Generate a cache key for user-specific data"""
    key = f"user:{user_id}"
    if suffix:
        key += f":{suffix}"
    return key


def cache_key_for_model(model_name: str, model_id: str | int, suffix: str = "") -> str:
    """Generate a cache key for model-specific data"""
    key = f"{model_name}:{model_id}"
    if suffix:
        key += f":{suffix}"
    return key


async def invalidate_user_cache(user_id: str | int):
    """Invalidate all cache entries for a specific user"""
    pattern = cache_key_for_user(user_id, "*")
    await cache_manager.delete_pattern(pattern)


async def invalidate_model_cache(model_name: str, model_id: str | int):
    """Invalidate all cache entries for a specific model"""
    pattern = cache_key_for_model(model_name, model_id, "*")
    await cache_manager.delete_pattern(pattern)
