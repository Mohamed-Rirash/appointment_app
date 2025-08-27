"""
Global dependencies for authentication, authorization, and common functionality
This module provides reusable dependencies that can be used across all modules
"""
from typing import Optional, Callable, List, Dict, Any, Union
from uuid import UUID

from fastapi import Depends, HTTPException, status, Query, Path, Request, Header
from databases import Database

from app.database import get_db
from app.auth.dependencies import get_current_user, require_active_user, require_authentication, CurrentUser


# ================================
# Authentication Dependencies
# ================================

async def get_current_user_global(
    current_user: CurrentUser = Depends(require_active_user)
) -> CurrentUser:
    """Get current active user - global version"""
    return current_user


async def get_optional_user_global(
    current_user: Optional[CurrentUser] = Depends(get_current_user)
) -> Optional[CurrentUser]:
    """Get optional current user - allows anonymous access"""
    return current_user


async def get_verified_user(
    current_user: CurrentUser = Depends(get_current_user_global)
) -> CurrentUser:
    """Get current user and ensure they are verified"""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user


async def get_admin_user(
    current_user: CurrentUser = Depends(get_current_user_global)
) -> CurrentUser:
    """Get current user and ensure they have admin role"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_super_admin_user_global(
    current_user: CurrentUser = Depends(get_current_user_global)
) -> CurrentUser:
    """Get current user and ensure they have super admin role"""
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


# ================================
# Authorization Dependencies
# ================================

def require_role(role: str) -> Callable:
    """Dependency factory for requiring specific roles"""

    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> CurrentUser:
        if role not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required"
            )
        return current_user

    return role_checker


def require_permission(permission: str) -> Callable:
    """Dependency factory for requiring specific permissions"""

    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> CurrentUser:
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user

    return permission_checker


def require_any_role(roles: List[str]) -> Callable:
    """Dependency factory for requiring any of the specified roles"""

    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> CurrentUser:
        if not any(role in current_user.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these roles required: {', '.join(roles)}"
            )
        return current_user

    return role_checker


def require_any_permission(permissions: List[str]) -> Callable:
    """Dependency factory for requiring any of the specified permissions"""

    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> CurrentUser:
        if not any(perm in current_user.permissions for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {', '.join(permissions)}"
            )
        return current_user

    return permission_checker


# ================================
# Resource Ownership Dependencies
# ================================

def require_ownership_or_admin(
    resource_owner_field: str = "owner_id",
    admin_override: bool = True
) -> Callable:
    """Dependency factory for requiring resource ownership or admin access"""
    
    async def ownership_checker(
        resource: Dict[str, Any],
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> Dict[str, Any]:
        
        # Admin override
        if admin_override and current_user.is_admin:
            return resource
        
        # Check ownership
        resource_owner_id = resource.get(resource_owner_field)
        if resource_owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own resources"
            )
        
        return resource
    
    return ownership_checker


def require_ownership_or_role(
    resource_owner_field: str = "owner_id",
    allowed_roles: List[str] = None
) -> Callable:
    """Dependency factory for requiring resource ownership or specific roles"""
    
    if allowed_roles is None:
        allowed_roles = ["admin", "super_admin"]
    
    async def ownership_checker(
        resource: Dict[str, Any],
        current_user: CurrentUser = Depends(get_current_user_global)
    ) -> Dict[str, Any]:
        
        # Check roles
        if any(role in current_user.roles for role in allowed_roles):
            return resource
        
        # Check ownership
        resource_owner_id = resource.get(resource_owner_field)
        if resource_owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own resources or need appropriate role"
            )
        
        return resource
    
    return ownership_checker


# ================================
# Validation Dependencies
# ================================

async def validate_uuid(
    resource_id: UUID = Path(..., description="Resource ID")
) -> UUID:
    """Validate UUID parameter"""
    return resource_id


def validate_pagination(
    max_size: int = 100,
    default_size: int = 20
) -> Callable:
    """Dependency factory for pagination validation"""
    
    async def pagination_validator(
        page: int = Query(1, ge=1, description="Page number"),
        size: int = Query(default_size, ge=1, le=max_size, description="Items per page")
    ) -> Dict[str, int]:
        return {"page": page, "size": size}
    
    return pagination_validator


def validate_date_range() -> Callable:
    """Dependency for date range validation"""
    
    async def date_range_validator(
        start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
        end_date: Optional[str] = Query(None, description="End date (ISO format)")
    ) -> Dict[str, Any]:
        
        from datetime import datetime
        
        parsed_start = None
        parsed_end = None
        
        try:
            if start_date:
                parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if end_date:
                parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: {str(e)}"
            )
        
        if parsed_start and parsed_end and parsed_start > parsed_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before end date"
            )
        
        return {"start_date": parsed_start, "end_date": parsed_end}
    
    return date_range_validator


# ================================
# Request Context Dependencies
# ================================

async def get_request_context(request: Request) -> Dict[str, Any]:
    """Get request context information"""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "method": request.method,
        "url": str(request.url),
        "headers": dict(request.headers)
    }


async def get_client_info(request: Request) -> Dict[str, str]:
    """Get client information from request"""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "referer": request.headers.get("referer", ""),
        "origin": request.headers.get("origin", "")
    }


# ================================
# Confirmation Dependencies
# ================================

def require_confirmation(
    header_name: str = "X-Confirm-Operation",
    required_value: str = "true"
) -> Callable:
    """Dependency factory for requiring confirmation headers"""
    
    async def confirmation_checker(
        confirmation: Optional[str] = Header(None, alias=header_name)
    ) -> bool:
        if confirmation != required_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Operation requires confirmation header: {header_name}: {required_value}"
            )
        return True
    
    return confirmation_checker


def require_critical_confirmation(operation_name: str) -> Callable:
    """Dependency for critical operations requiring explicit confirmation"""
    
    async def critical_confirmation_checker(
        confirmation: Optional[str] = Header(None, alias="X-Confirm-Critical-Operation")
    ) -> bool:
        expected_value = f"CONFIRM_{operation_name.upper()}"
        
        if confirmation != expected_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Critical operation requires confirmation header: X-Confirm-Critical-Operation: {expected_value}"
            )
        return True
    
    return critical_confirmation_checker


# ================================
# Rate Limiting Dependencies
# ================================

async def check_rate_limit(
    request: Request,
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global)
) -> bool:
    """Basic rate limiting check (placeholder for Redis implementation)"""
    
    # TODO: Implement actual rate limiting with Redis
    # This is a placeholder that always returns True
    
    client_id = current_user.id if current_user else request.client.host
    
    # In a real implementation, you would:
    # 1. Check Redis for current request count
    # 2. Increment counter
    # 3. Set expiration if first request
    # 4. Raise HTTPException if limit exceeded
    
    return True


# ================================
# Common Query Dependencies
# ================================

async def get_search_params(
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search term"),
    sort_by: Optional[str] = Query(None, description="Sort field"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Sort order")
) -> Dict[str, Any]:
    """Get common search and sorting parameters"""
    return {
        "search": search.strip() if search else None,
        "sort_by": sort_by,
        "sort_order": sort_order
    }


async def get_filter_params(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    created_after: Optional[str] = Query(None, description="Filter by creation date (after)"),
    created_before: Optional[str] = Query(None, description="Filter by creation date (before)")
) -> Dict[str, Any]:
    """Get common filtering parameters"""
    
    from datetime import datetime
    
    # Parse dates
    parsed_created_after = None
    parsed_created_before = None
    
    try:
        if created_after:
            parsed_created_after = datetime.fromisoformat(created_after.replace('Z', '+00:00'))
        if created_before:
            parsed_created_before = datetime.fromisoformat(created_before.replace('Z', '+00:00'))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    
    return {
        "is_active": is_active,
        "created_after": parsed_created_after,
        "created_before": parsed_created_before
    }


# ================================
# Convenience Dependencies
# ================================

# Common pagination
CommonPagination = Depends(validate_pagination())
LargePagination = Depends(validate_pagination(max_size=1000, default_size=50))
SmallPagination = Depends(validate_pagination(max_size=50, default_size=10))

# Common auth requirements
RequireAuth = Depends(get_current_user_global)
RequireVerified = Depends(get_verified_user)
RequireAdmin = Depends(get_admin_user)
RequireSuperAdmin = Depends(get_super_admin_user_global)
OptionalAuth = Depends(get_optional_user_global)

# Common confirmations
RequireConfirmation = Depends(require_confirmation())
RequireDeleteConfirmation = Depends(require_confirmation("X-Confirm-Delete", "DELETE"))

# Common context
RequestContext = Depends(get_request_context)
ClientInfo = Depends(get_client_info)

# Common queries
SearchParams = Depends(get_search_params)
FilterParams = Depends(get_filter_params)
DateRange = Depends(validate_date_range())
