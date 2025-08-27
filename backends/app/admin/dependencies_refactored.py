"""
Admin module specific dependencies
Uses global dependencies from app.dependencies and adds admin-specific functionality
"""
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status, Query
from databases import Database

from app.database import get_db
from app.dependencies import (
    get_current_user_global, get_admin_user, get_super_admin_user_global,
    require_role, require_permission, require_any_role,
    CommonPagination, RequireAuth, RequireAdmin, RequireSuperAdmin,
    SearchParams, FilterParams
)
from app.schemas import PaginationParams
from app.auth.models import User
from app.admin.schemas import AdminActionType


# ================================
# Admin-Specific Dependencies
# ================================

async def get_admin_user_enhanced(
    current_user: User = RequireAdmin
) -> User:
    """Get admin user with enhanced admin properties"""
    
    # Add any admin-specific enhancements here
    # For example, load admin-specific permissions or settings
    
    return current_user


def require_admin_level(min_level: str) -> callable:
    """Require specific admin level (admin, super_admin, system_admin)"""
    
    async def level_checker(current_user: User = RequireAuth) -> User:
        
        admin_hierarchy = {
            "admin": 1,
            "super_admin": 2,
            "system_admin": 3
        }
        
        user_level = 0
        for role in current_user.roles:
            if role in admin_hierarchy:
                user_level = max(user_level, admin_hierarchy[role])
        
        required_level = admin_hierarchy.get(min_level, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Minimum admin level required: {min_level}"
            )
        
        return current_user
    
    return level_checker


async def validate_admin_action(
    action: AdminActionType,
    current_user: User = RequireAdmin
) -> bool:
    """Validate if admin can perform specific action"""
    
    # Define action permissions
    action_permissions = {
        AdminActionType.USER_CREATE: ["admin", "super_admin"],
        AdminActionType.USER_UPDATE: ["admin", "super_admin"],
        AdminActionType.USER_DELETE: ["super_admin"],
        AdminActionType.USER_SUSPEND: ["admin", "super_admin"],
        AdminActionType.ROLE_ASSIGN: ["super_admin"],
        AdminActionType.ROLE_REVOKE: ["super_admin"],
        AdminActionType.SYSTEM_CONFIG: ["super_admin"],
        AdminActionType.AUDIT_VIEW: ["admin", "super_admin"],
    }
    
    required_roles = action_permissions.get(action, ["super_admin"])
    
    if not any(role in current_user.roles for role in required_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions for action: {action}"
        )
    
    return True


# ================================
# Admin Query Parameters
# ================================

async def get_admin_filters(
    user_status: Optional[str] = Query(None, description="Filter by user status"),
    role_name: Optional[str] = Query(None, description="Filter by role"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    # Use global search and date filters
    search_params: dict = SearchParams,
    filter_params: dict = FilterParams
) -> Dict[str, Any]:
    """Get admin-specific filters"""
    
    return {
        "user_status": user_status,
        "role_name": role_name,
        "is_verified": is_verified,
        "is_active": is_active,
        "search": search_params.get("search"),
        "created_after": filter_params.get("created_after"),
        "created_before": filter_params.get("created_before")
    }


async def get_audit_filters(
    action_type: Optional[AdminActionType] = Query(None, description="Filter by action type"),
    admin_id: Optional[UUID] = Query(None, description="Filter by admin ID"),
    target_user_id: Optional[UUID] = Query(None, description="Filter by target user ID"),
    # Use global date filters
    filter_params: dict = FilterParams
) -> Dict[str, Any]:
    """Get audit log filters"""
    
    return {
        "action_type": action_type,
        "admin_id": admin_id,
        "target_user_id": target_user_id,
        "created_after": filter_params.get("created_after"),
        "created_before": filter_params.get("created_before")
    }


# ================================
# Resource Access Validation
# ================================

async def validate_user_access(
    target_user_id: UUID,
    current_user: User = RequireAdmin,
    db: Database = Depends(get_db)
) -> Dict[str, Any]:
    """Validate admin can access target user"""
    
    from app.auth.crud import UserCRUD
    
    # Get target user
    target_user = await UserCRUD.get_by_id(db, target_user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # System users can only be managed by super admins
    if target_user.get("is_system_user", False) and not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System users can only be managed by super admins"
        )
    
    # Prevent self-management for critical operations
    if target_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot perform this action on your own account"
        )
    
    return target_user


async def validate_role_assignment(
    role_name: str,
    current_user: User = RequireAdmin
) -> bool:
    """Validate admin can assign specific role"""
    
    # Define role assignment permissions
    role_permissions = {
        "user": ["admin", "super_admin"],
        "admin": ["super_admin"],
        "super_admin": ["system_admin"],  # Only system admins can create super admins
        "system_admin": []  # System admins cannot be created via API
    }
    
    allowed_roles = role_permissions.get(role_name, [])
    
    if not any(role in current_user.roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions to assign role: {role_name}"
        )
    
    return True


# ================================
# Convenience Dependencies
# ================================

# Admin level requirements
RequireBasicAdmin = Depends(require_admin_level("admin"))
RequireSuperAdminLevel = Depends(require_admin_level("super_admin"))
RequireSystemAdminLevel = Depends(require_admin_level("system_admin"))

# Common admin operations
RequireUserManagement = Depends(require_permission("user:manage"))
RequireRoleManagement = Depends(require_permission("role:manage"))
RequireSystemConfig = Depends(require_permission("system:config"))
RequireAuditAccess = Depends(require_permission("audit:view"))

# Enhanced admin user
AdminUserEnhanced = Depends(get_admin_user_enhanced)
