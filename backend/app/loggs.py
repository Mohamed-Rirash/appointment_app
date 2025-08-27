"""
Structured logging configuration for FastAPI application
"""

import json
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger
from starlette.requests import Request

from app.config import get_settings

settings = get_settings()

# Context variables for request tracing
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


class StructuredLogger:
    """Structured logger with request tracing support"""

    def __init__(self):
        self._configured = False
        self.setup_logging()

    def setup_logging(self):
        """Configure loguru logger"""
        if self._configured:
            return

        # Remove default handler
        logger.remove()

        # Configure format based on settings
        if settings.LOG_FORMAT == "json":
            # For JSON format, use loguru's built-in serialization
            log_format = "{time} | {level} | {name}:{function}:{line} | {message}"
            serialize = True
            colorize = False
        else:
            log_format = (
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                "<level>{message}</level>"
            )
            serialize = False
            colorize = True

        # Add console handler
        logger.add(
            sys.stderr,
            format=log_format,
            level=settings.LOG_LEVEL,
            colorize=colorize,
            serialize=serialize,
        )

        # Add file handler if specified
        if settings.LOG_FILE:
            log_file = Path(settings.LOG_FILE)
            log_file.parent.mkdir(parents=True, exist_ok=True)

            logger.add(
                str(log_file),
                format=log_format,
                level=settings.LOG_LEVEL,
                rotation=settings.LOG_ROTATION,
                retention=settings.LOG_RETENTION,
                serialize=serialize,
            )

        self._configured = True

    def _json_formatter(self, record):
        """Custom JSON formatter with request context"""
        log_entry = {
            "timestamp": datetime.now(datetime.timezone.utc).isoformat(),
            "level": record["level"].name,
            "logger": record["name"],
            "module": record["module"],
            "function": record["function"],
            "line": record["line"],
            "message": record["message"],
        }

        # Add request context if available
        request_id = request_id_var.get()
        if request_id:
            log_entry["request_id"] = request_id

        user_id = user_id_var.get()
        if user_id:
            log_entry["user_id"] = user_id

        # Add extra fields from record
        if record.get("extra"):
            log_entry.update(record["extra"])

        return json.dumps(log_entry)

    def bind_request(self, request: Request, user_id: Optional[str] = None):
        """Bind request context to logger"""
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)

        if user_id:
            user_id_var.set(user_id)

        # Add request ID to headers for client tracking
        if hasattr(request, "state"):
            request.state.request_id = request_id

        return request_id

    def clear_context(self):
        """Clear request context"""
        request_id_var.set(None)
        user_id_var.set(None)


# Global logger instance
structured_logger = StructuredLogger()


def get_logger(name: str = __name__):
    """Get a logger instance with the given name"""
    return logger.bind(logger_name=name)


def log_request(
    method: str,
    url: str,
    status_code: int,
    duration: float,
    request_size: Optional[int] = None,
    response_size: Optional[int] = None,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    """Log HTTP request details"""
    log_data = {
        "event": "http_request",
        "method": method,
        "url": str(url),
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
    }

    if request_size is not None:
        log_data["request_size"] = request_size

    if response_size is not None:
        log_data["response_size"] = response_size

    if user_agent:
        log_data["user_agent"] = user_agent

    if ip_address:
        log_data["ip_address"] = ip_address

    logger.info("HTTP Request", **log_data)


def log_auth_event(
    event_type: str,
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    success: bool = True,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    """Log authentication events"""
    log_data = {
        "event": "auth_event",
        "event_type": event_type,
        "success": success,
    }

    if user_id:
        log_data["user_id"] = user_id

    if email:
        log_data["email"] = email

    if reason:
        log_data["reason"] = reason

    if ip_address:
        log_data["ip_address"] = ip_address

    if success:
        logger.info("Authentication Event", **log_data)
    else:
        logger.warning("Authentication Failed", **log_data)


def log_security_event(
    event_type: str,
    severity: str = "medium",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """Log security-related events"""
    log_data = {
        "event": "security_event",
        "event_type": event_type,
        "severity": severity,
    }

    if details:
        log_data.update(details)

    if ip_address:
        log_data["ip_address"] = ip_address

    if user_id:
        log_data["user_id"] = user_id

    if severity in ["high", "critical"]:
        logger.error("Security Event", **log_data)
    elif severity == "medium":
        logger.warning("Security Event", **log_data)
    else:
        logger.info("Security Event", **log_data)


def log_database_event(
    operation: str,
    table: str,
    duration: float,
    success: bool = True,
    error: Optional[str] = None,
    affected_rows: Optional[int] = None,
):
    """Log database operations"""
    log_data = {
        "event": "database_operation",
        "operation": operation,
        "table": table,
        "duration_ms": round(duration * 1000, 2),
        "success": success,
    }

    if affected_rows is not None:
        log_data["affected_rows"] = affected_rows

    if error:
        log_data["error"] = error

    if success:
        logger.info("Database Operation", **log_data)
    else:
        logger.error("Database Operation Failed", **log_data)


def log_cache_event(
    operation: str,
    key: str,
    hit: Optional[bool] = None,
    duration: Optional[float] = None,
    size: Optional[int] = None,
):
    """Log cache operations"""
    log_data = {
        "event": "cache_operation",
        "operation": operation,
        "key": key,
    }

    if hit is not None:
        log_data["cache_hit"] = hit

    if duration is not None:
        log_data["duration_ms"] = round(duration * 1000, 2)

    if size is not None:
        log_data["size_bytes"] = size

    logger.info("Cache Operation", **log_data)
