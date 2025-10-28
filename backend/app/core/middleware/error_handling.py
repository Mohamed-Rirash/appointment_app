"""
Error handling middleware for FastAPI application with Loguru integration
"""

import traceback
import uuid
from collections.abc import Callable

from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import DatabaseError, IntegrityError, SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import get_logger

settings = get_settings()
logger = get_logger(__name__)



class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for centralized error handling with comprehensive logging"""

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        try:
            response = await call_next(request)
            return response

        except HTTPException as e:
            # FastAPI HTTP exceptions - pass through with logging
            logger.info(
                "HTTP exception",
                path=request.url.path,
                method=request.method,
                status_code=e.status_code,
                detail=e.detail
            )

            return JSONResponse(
                status_code=e.status_code,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "http_exception",
                            "message": e.detail,
                            "status_code": e.status_code,
                        }
                    }
                ),
                headers=e.headers,
            )

        except ValidationError as e:
            # Pydantic validation errors
            logger.warning(
                "Validation error",
                path=request.url.path,
                method=request.method,
                errors=e.errors()
            )

            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "validation_error",
                            "message": "Validation failed",
                            "details": e.errors(),
                        }
                    }
                ),
            )

        except IntegrityError as e:
            # Database integrity constraint violations
            error_id = str(uuid.uuid4())
            logger.error(
                f"Database integrity error [{error_id}]",
                path=request.url.path,
                method=request.method,
                error=str(e),
                error_type="IntegrityError"
            )

            # Try to extract meaningful message
            error_msg = "Database constraint violation"
            if "unique" in str(e).lower():
                error_msg = "A record with this information already exists"
            elif "foreign key" in str(e).lower():
                error_msg = "Referenced record does not exist"
            elif "not null" in str(e).lower():
                error_msg = "Required field is missing"

            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "integrity_error",
                            "message": error_msg,
                            "error_id": error_id,
                            "details": str(e) if settings.is_development else None,
                        }
                    }
                ),
            )

        except (SQLAlchemyError, DatabaseError) as e:
            # Database errors
            error_id = str(uuid.uuid4())
            logger.error(
                f"Database error [{error_id}]",
                path=request.url.path,
                method=request.method,
                error=str(e),
                error_type=type(e).__name__
            )

            if settings.is_development:
                logger.error(f"Database error traceback: {traceback.format_exc()}")

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "database_error",
                            "message": "Database operation failed",
                            "error_id": error_id,
                            "details": str(e) if settings.is_development else None,
                        }
                    }
                ),
            )

        except ValueError as e:
            # Value errors (often from business logic)
            logger.warning(
                "Value error",
                path=request.url.path,
                method=request.method,
                error=str(e)
            )

            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=jsonable_encoder(
                    {"error": {"type": "value_error", "message": str(e)}}
                ),
            )

        except PermissionError as e:
            # Permission errors
            logger.warning(
                "Permission error",
                path=request.url.path,
                method=request.method,
                error=str(e)
            )

            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "permission_error",
                            "message": "Insufficient permissions",
                        }
                    }
                ),
            )

        except Exception as e:
            # Unexpected errors
            error_id = str(uuid.uuid4())
            logger.error(
                f"Unexpected error [{error_id}]",
                path=request.url.path,
                method=request.method,
                error=str(e),
                error_type=type(e).__name__
            )

            if settings.is_development:
                logger.error(f"Traceback: {traceback.format_exc()}")

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=jsonable_encoder(
                    {
                        "error": {
                            "type": "internal_error",
                            "message": "An unexpected error occurred",
                            "error_id": error_id,
                            "details": str(e) if settings.is_development else None,
                        }
                    }
                ),
            )



# Helper functions for creating standardized error responses
def create_error_response(
    status_code: int,
    message: str,
    error_type: str = "error",
    details: dict | list | str | None = None,
    error_id: str | None = None,
) -> JSONResponse:
    """Helper function to create standardized error responses"""
    content = {"error": {"type": error_type, "message": message}}

    if details is not None:
        content["error"]["details"] = details  # type: ignore

    if error_id:
        content["error"]["error_id"] = error_id

    return JSONResponse(status_code=status_code, content=jsonable_encoder(content))


def create_validation_error_response(errors: list, error_id: str | None = None) -> JSONResponse:
    """Helper function to create validation error responses"""
    content = {
        "error": {
            "type": "validation_error",
            "message": "Validation failed",
            "details": errors,
        }
    }

    if error_id:
        content["error"]["error_id"] = error_id

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(content),
    )


# Custom exception classes
class BusinessLogicError(Exception):
    """Custom exception for business logic errors"""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class AuthenticationError(Exception):
    """Custom exception for authentication errors"""

    def __init__(self, message: str = "Authentication failed", details: dict | None = None):
        self.message = message
        self.details = details
        super().__init__(message)


class AuthorizationError(Exception):
    """Custom exception for authorization errors"""

    def __init__(self, message: str = "Insufficient permissions", details: dict | None = None):
        self.message = message
        self.details = details
        super().__init__(message)


class ResourceNotFoundError(Exception):
    """Custom exception for resource not found errors"""

    def __init__(self, resource: str, identifier: str = "", details: dict | None = None):
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
        else:
            message = f"{resource} not found"
        self.message = message
        self.resource = resource
        self.identifier = identifier
        self.details = details
        super().__init__(message)


class ConflictError(Exception):
    """Custom exception for resource conflict errors"""

    def __init__(self, message: str, details: dict | None = None):
        self.message = message
        self.details = details
        super().__init__(message)


class RateLimitError(Exception):
    """Custom exception for rate limit errors"""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int | None = None):
        self.message = message
        self.retry_after = retry_after
        super().__init__(message)


# Exception handlers for custom exceptions
async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
    """Handler for business logic errors"""
    error_id = str(uuid.uuid4())
    logger.warning(
        f"Business logic error [{error_id}]",
        path=request.url.path,
        method=request.method,
        message=exc.message
    )

    content = {
        "error": {
            "type": "business_logic_error",
            "message": exc.message,
            "error_id": error_id
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )


async def authentication_error_handler(request: Request, exc: AuthenticationError):
    """Handler for authentication errors"""
    error_id = str(uuid.uuid4())
    logger.warning(
        f"Authentication error [{error_id}]",
        path=request.url.path,
        method=request.method,
        message=exc.message
    )

    content = {
        "error": {
            "type": "authentication_error",
            "message": exc.message,
            "error_id": error_id
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=content,
    )


async def authorization_error_handler(request: Request, exc: AuthorizationError):
    """Handler for authorization errors"""
    error_id = str(uuid.uuid4())
    logger.warning(
        f"Authorization error [{error_id}]",
        path=request.url.path,
        method=request.method,
        message=exc.message
    )

    content = {
        "error": {
            "type": "authorization_error",
            "message": exc.message,
            "error_id": error_id
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content=content,
    )


async def resource_not_found_error_handler(request: Request, exc: ResourceNotFoundError):
    """Handler for resource not found errors"""
    error_id = str(uuid.uuid4())
    logger.info(
        f"Resource not found [{error_id}]",
        path=request.url.path,
        method=request.method,
        resource=exc.resource,
        identifier=exc.identifier
    )

    content = {
        "error": {
            "type": "resource_not_found",
            "message": exc.message,
            "error_id": error_id
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=content,
    )


async def conflict_error_handler(request: Request, exc: ConflictError):
    """Handler for conflict errors"""
    error_id = str(uuid.uuid4())
    logger.warning(
        f"Conflict error [{error_id}]",
        path=request.url.path,
        method=request.method,
        message=exc.message
    )

    content = {
        "error": {
            "type": "conflict_error",
            "message": exc.message,
            "error_id": error_id
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=content,
    )


async def rate_limit_error_handler(request: Request, exc: RateLimitError):
    """Handler for rate limit errors"""
    error_id = str(uuid.uuid4())
    logger.warning(
        f"Rate limit error [{error_id}]",
        path=request.url.path,
        method=request.method,
        message=exc.message
    )

    headers = {}
    if exc.retry_after:
        headers["Retry-After"] = str(exc.retry_after)

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "type": "rate_limit_error",
                "message": exc.message,
                "error_id": error_id,
                "retry_after": exc.retry_after
            }
        },
        headers=headers,
    )
