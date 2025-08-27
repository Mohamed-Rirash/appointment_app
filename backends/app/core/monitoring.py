"""
Health checks and monitoring for FastAPI application
"""
import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import redis.asyncio as redis
from databases import Database
from sqlalchemy import text

from app.config import get_settings
from app.database import database
from app.core.cache import cache_manager

settings = get_settings()


class HealthChecker:
    """Health check system for application components"""
    
    def __init__(self):
        self.checks = {}
        self.last_check_time = None
        self.last_results = {}
    
    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        start_time = time.time()
        
        try:
            # Test basic connectivity
            await database.execute(text("SELECT 1"))
            
            # Test query performance
            query_start = time.time()
            await database.execute(text("SELECT COUNT(*) FROM information_schema.tables"))
            query_duration = time.time() - query_start
            
            duration = time.time() - start_time
            
            return {
                "status": "healthy",
                "response_time_ms": round(duration * 1000, 2),
                "query_time_ms": round(query_duration * 1000, 2),
                "connection_pool": {
                    "size": getattr(database._pool, "size", "unknown") if hasattr(database, "_pool") else "unknown",
                    "checked_out": getattr(database._pool, "checked_out", "unknown") if hasattr(database, "_pool") else "unknown"
                }
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": round(duration * 1000, 2)
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance"""
        start_time = time.time()
        
        try:
            if not cache_manager.is_connected:
                await cache_manager.connect()
            
            # Test basic connectivity
            await cache_manager._redis.ping()
            
            # Test read/write performance
            test_key = "health_check_test"
            test_value = "test_value"
            
            write_start = time.time()
            await cache_manager.set(test_key, test_value, ttl=10)
            write_duration = time.time() - write_start
            
            read_start = time.time()
            result = await cache_manager.get(test_key)
            read_duration = time.time() - read_start
            
            # Clean up
            await cache_manager.delete(test_key)
            
            duration = time.time() - start_time
            
            # Get Redis info
            info = await cache_manager._redis.info()
            
            return {
                "status": "healthy",
                "response_time_ms": round(duration * 1000, 2),
                "write_time_ms": round(write_duration * 1000, 2),
                "read_time_ms": round(read_duration * 1000, 2),
                "test_successful": result == test_value,
                "memory_usage": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", "unknown"),
                "version": info.get("redis_version", "unknown")
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": round(duration * 1000, 2)
            }
    
    async def check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space"""
        try:
            import shutil
            
            # Check current directory disk usage
            total, used, free = shutil.disk_usage(".")
            
            free_percent = (free / total) * 100
            used_percent = (used / total) * 100
            
            status = "healthy"
            if free_percent < 10:  # Less than 10% free
                status = "critical"
            elif free_percent < 20:  # Less than 20% free
                status = "warning"
            
            return {
                "status": status,
                "total_gb": round(total / (1024**3), 2),
                "used_gb": round(used / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2),
                "used_percent": round(used_percent, 2),
                "free_percent": round(free_percent, 2)
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def check_memory_usage(self) -> Dict[str, Any]:
        """Check memory usage"""
        try:
            import psutil
            
            memory = psutil.virtual_memory()
            
            status = "healthy"
            if memory.percent > 90:
                status = "critical"
            elif memory.percent > 80:
                status = "warning"
            
            return {
                "status": status,
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_percent": memory.percent,
                "free_percent": 100 - memory.percent
            }
            
        except ImportError:
            return {
                "status": "unknown",
                "error": "psutil not available"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        start_time = time.time()
        
        # Run checks concurrently
        checks = await asyncio.gather(
            self.check_database(),
            self.check_redis(),
            self.check_disk_space(),
            self.check_memory_usage(),
            return_exceptions=True
        )
        
        results = {
            "database": checks[0] if not isinstance(checks[0], Exception) else {"status": "error", "error": str(checks[0])},
            "redis": checks[1] if not isinstance(checks[1], Exception) else {"status": "error", "error": str(checks[1])},
            "disk": checks[2] if not isinstance(checks[2], Exception) else {"status": "error", "error": str(checks[2])},
            "memory": checks[3] if not isinstance(checks[3], Exception) else {"status": "error", "error": str(checks[3])}
        }
        
        # Determine overall status
        statuses = [check.get("status", "unknown") for check in results.values()]
        
        if "critical" in statuses or "unhealthy" in statuses:
            overall_status = "unhealthy"
        elif "warning" in statuses:
            overall_status = "degraded"
        elif all(status == "healthy" for status in statuses):
            overall_status = "healthy"
        else:
            overall_status = "unknown"
        
        duration = time.time() - start_time
        
        self.last_check_time = datetime.now(timezone.utc)
        self.last_results = results
        
        return {
            "status": overall_status,
            "timestamp": self.last_check_time.isoformat(),
            "check_duration_ms": round(duration * 1000, 2),
            "checks": results,
            "version": "1.0.0",  # You can make this dynamic
            "environment": settings.ENVIRONMENT
        }


# Global health checker instance
health_checker = HealthChecker()


class MetricsCollector:
    """Simple metrics collector"""
    
    def __init__(self):
        self.metrics = {
            "requests_total": 0,
            "requests_by_method": {},
            "requests_by_status": {},
            "response_times": [],
            "errors_total": 0,
            "start_time": time.time()
        }
    
    def record_request(self, method: str, status_code: int, duration: float):
        """Record a request metric"""
        self.metrics["requests_total"] += 1
        
        # Track by method
        if method not in self.metrics["requests_by_method"]:
            self.metrics["requests_by_method"][method] = 0
        self.metrics["requests_by_method"][method] += 1
        
        # Track by status code
        status_group = f"{status_code // 100}xx"
        if status_group not in self.metrics["requests_by_status"]:
            self.metrics["requests_by_status"][status_group] = 0
        self.metrics["requests_by_status"][status_group] += 1
        
        # Track response times (keep last 1000)
        self.metrics["response_times"].append(duration)
        if len(self.metrics["response_times"]) > 1000:
            self.metrics["response_times"] = self.metrics["response_times"][-1000:]
        
        # Track errors
        if status_code >= 400:
            self.metrics["errors_total"] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        uptime = time.time() - self.metrics["start_time"]
        
        # Calculate response time statistics
        response_times = self.metrics["response_times"]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            response_times_sorted = sorted(response_times)
            p50 = response_times_sorted[len(response_times_sorted) // 2]
            p95 = response_times_sorted[int(len(response_times_sorted) * 0.95)]
            p99 = response_times_sorted[int(len(response_times_sorted) * 0.99)]
        else:
            avg_response_time = p50 = p95 = p99 = 0
        
        return {
            "uptime_seconds": round(uptime, 2),
            "requests_total": self.metrics["requests_total"],
            "requests_per_second": round(self.metrics["requests_total"] / uptime, 2) if uptime > 0 else 0,
            "errors_total": self.metrics["errors_total"],
            "error_rate": round(self.metrics["errors_total"] / max(self.metrics["requests_total"], 1), 4),
            "requests_by_method": self.metrics["requests_by_method"],
            "requests_by_status": self.metrics["requests_by_status"],
            "response_time_ms": {
                "avg": round(avg_response_time * 1000, 2),
                "p50": round(p50 * 1000, 2),
                "p95": round(p95 * 1000, 2),
                "p99": round(p99 * 1000, 2)
            }
        }


# Global metrics collector
metrics_collector = MetricsCollector()
