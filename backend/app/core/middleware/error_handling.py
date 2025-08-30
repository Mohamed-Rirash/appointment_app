"""
Error handling middleware for FastAPI application
"""

import traceback
from typing import Callable, Union

from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.loggs import get_logger

settings = get_settings()
logger = get_logger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for centralized error handling"""

    async def dispatch(self, request: Request, call_next: Callable) -> JSONResponse:
        try:
            response = await call_next(request)
            return response

        except HTTPException as e:
            # FastAPI HTTP exceptions - pass through
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
            logger.warning(f"Validation error: {e}")
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

        except SQLAlchemyError as e:
            # Database errors
            logger.error(f"Database error: {e}")

            if settings.is_development:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content=jsonable_encoder(
                        {
                            "error": {
                                "type": "database_error",
                                "message": "Database operation failed",
                                "details": str(e) if settings.is_development else None,
                            }
                        }
                    ),
                )
            else:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content=jsonable_encoder(
                        {
                            "error": {
                                "type": "database_error",
                                "message": "Database operation failed",
                            }
                        }
                    ),
                )

        except ValueError as e:
            # Value errors (often from business logic)
            logger.warning(f"Value error: {e}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=jsonable_encoder(
                    {"error": {"type": "value_error", "message": str(e)}}
                ),
            )

        except PermissionError as e:
            # Permission errors
            logger.warning(f"Permission error: {e}")
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
            error_id = id(e)  # Simple error ID for tracking
            logger.error(f"Unexpected error [{error_id}]: {e}")

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


def create_error_response(
    status_code: int,
    message: str,
    error_type: str = "error",
    details: Union[dict, list, str, None] = None,
) -> JSONResponse:
    """Helper function to create standardized error responses"""
    content = {"error": {"type": error_type, "message": message}}

    if details is not None:
        content["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=jsonable_encoder(content))


def create_validation_error_response(errors: list) -> JSONResponse:
    """Helper function to create validation error responses"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            {
                "error": {
                    "type": "validation_error",
                    "message": "Validation failed",
                    "details": errors,
                }
            }
        ),
    )


class BusinessLogicError(Exception):
    """Custom exception for business logic errors"""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(Exception):
    """Custom exception for authentication errors"""

    def __init__(self, message: str = "Authentication failed"):
        self.message = message
        super().__init__(message)


class AuthorizationError(Exception):
    """Custom exception for authorization errors"""

    def __init__(self, message: str = "Insufficient permissions"):
        self.message = message
        super().__init__(message)


class ResourceNotFoundError(Exception):
    """Custom exception for resource not found errors"""

    def __init__(self, resource: str, identifier: str = None):
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
        else:
            message = f"{resource} not found"
        self.message = message
        super().__init__(message)


class ConflictError(Exception):
    """Custom exception for resource conflict errors"""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


# Exception handlers for custom exceptions
async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
    """Handler for business logic errors"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"type": "business_logic_error", "message": exc.message}},
    )


async def authentication_error_handler(request: Request, exc: AuthenticationError):
    """Handler for authentication errors"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"error": {"type": "authentication_error", "message": exc.message}},
    )


async def authorization_error_handler(request: Request, exc: AuthorizationError):
    """Handler for authorization errors"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"error": {"type": "authorization_error", "message": exc.message}},
    )


async def resource_not_found_error_handler(
    request: Request, exc: ResourceNotFoundError
):
    """Handler for resource not found errors"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": {"type": "resource_not_found", "message": exc.message}},
    )


async def conflict_error_handler(request: Request, exc: ConflictError):
    """Handler for conflict errors"""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": {"type": "conflict_error", "message": exc.message}},
    )
