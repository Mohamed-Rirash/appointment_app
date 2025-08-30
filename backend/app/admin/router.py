"""
Comprehensive admin panel endpoints for user and system management
"""

from typing import Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.admin.config import AdminPermissions
from app.admin.dependencies import (
    AdminUser,
    RequireUsersCreate,
    RequireUsersDelete,
    RequireUsersList,
    RequireUsersRead,
    RequireUsersUpdate,
    require_admin_permission,
    validate_role_assignment,
    validate_target_user_access,
)
from app.admin.schemas import (
    AdminBaseResponse,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    BulkOperationResult,
    BulkUserOperation,
    PaginatedResponse,
    PaginationParams,
    UserSearchFilters,
)
from app.admin.service import AdminUserService
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


# Note: Non-essential admin endpoints (dashboard, analytics, monitoring, audit,
# export, system config, health) have been removed to keep the admin API minimal.


# ================================
# User Management
# ================================


@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: Optional[str] = Query(None, description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    search: Optional[str] = Query(None, description="Search term"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verified status"),
    is_system_user: Optional[bool] = Query(
        None, description="Filter by system user status"
    ),
    admin_user: AdminUser = RequireUsersList,
    db: Database = Depends(get_db),
):
    """List users with pagination and filtering"""

    # Build pagination and filters
    pagination = PaginationParams(
        page=page, size=size, sort_by=sort_by, sort_order=sort_order
    )

    filters = UserSearchFilters(
        search=search,
        is_active=is_active,
        is_verified=is_verified,
        is_system_user=is_system_user,
    )

    # Get users
    users, total = await AdminUserService.get_users_paginated(db, pagination, filters)

    # Calculate pagination info
    pages = (total + size - 1) // size
    has_next = page < pages
    has_prev = page > 1

    return PaginatedResponse(
        appointments=users,
        total=total,
        page=page,
        size=size,
        pages=pages,
        has_next=has_next,
        has_prev=has_prev,
    )


@router.post("/users", response_model=AdminUserResponse)
async def create_user(
    user_data: AdminUserCreate,
    background_tasks: BackgroundTasks,
    admin_user: AdminUser = RequireUsersCreate,
    db: Database = Depends(get_db),
):
    """Create new user (super admin only)"""
    # If roles are provided, ensure the requester is allowed to assign them
    if user_data.roles:
        from app.auth.rbac import RoleCRUD

        forbidden_roles = []
        for role_value in user_data.roles:
            # Resolve role (accept name or id)
            role = None
            try:
                role = await RoleCRUD.get_by_id(db, UUID(role_value))
            except Exception:
                role = await RoleCRUD.get_by_name(db, role_value)
            if not role:
                # Let service raise 400 for missing roles
                continue
            if not admin_user.can_assign_role(role["name"]):
                forbidden_roles.append(role["name"])
        if forbidden_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Insufficient permission to assign roles",
                    "roles": forbidden_roles,
                },
            )

    created_user = await AdminUserService.create_user(
        db=db,
        user_data=user_data,
        created_by=admin_user.id,
        background_tasks=background_tasks,
    )
    return AdminUserResponse(**created_user)


@router.post("/users/{user_id}/resend-invite", response_model=AdminBaseResponse)
async def resend_invite(
    user_id: UUID = Depends(validate_target_user_access),
    background_tasks: BackgroundTasks = None,
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Resend invitation email to user."""
    await AdminUserService.resend_invite(
        db=db,
        user_id=user_id,
        requested_by=admin_user.id,
        background_tasks=background_tasks,
    )
    return AdminBaseResponse(message="Invitation sent")


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user_by_id(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersRead,
    db: Database = Depends(get_db),
):
    """Get user details by ID"""

    from app.admin.crud import AdminUserCRUD

    user = await AdminUserCRUD.get_user_with_roles(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return AdminUserResponse(**user)


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_data: AdminUserUpdate,
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Update user details"""

    updated_user = await AdminUserService.update_user(
        db, user_id, user_data, admin_user.id
    )
    return AdminUserResponse(**updated_user)


@router.delete("/users/{user_id}", response_model=AdminBaseResponse)
async def delete_user(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersDelete,
    db: Database = Depends(get_db),
):
    """Delete user (admin only) - System users are protected"""

    result = await AdminUserService.delete_user(db, user_id, admin_user.id)

    return AdminBaseResponse(success=result, message="User deleted successfully")


@router.post("/users/bulk", response_model=BulkOperationResult)
async def bulk_user_operation(
    operation: BulkUserOperation,
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Perform bulk operations on users"""

    # Additional permission check for delete operations
    if operation.operation == "delete" and not admin_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required for bulk delete operations",
        )

    result = await AdminUserService.bulk_operation(db, operation, admin_user.id)
    return result


@router.patch("/users/{user_id}/activate", response_model=AdminBaseResponse)
async def activate_user(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Activate user account"""

    from app.admin.schemas import AdminUserUpdate

    await AdminUserService.update_user(
        db, user_id, AdminUserUpdate(is_active=True), admin_user.id
    )

    return AdminBaseResponse(message="User activated successfully")


@router.patch("/users/{user_id}/deactivate", response_model=AdminBaseResponse)
async def deactivate_user(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Deactivate user account - System users are protected"""

    from app.admin.schemas import AdminUserUpdate

    await AdminUserService.update_user(
        db, user_id, AdminUserUpdate(is_active=False), admin_user.id
    )

    return AdminBaseResponse(message="User deactivated successfully")


@router.patch("/users/{user_id}/verify", response_model=AdminBaseResponse)
async def verify_user(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = RequireUsersUpdate,
    db: Database = Depends(get_db),
):
    """Verify user account"""

    from app.admin.schemas import AdminUserUpdate

    await AdminUserService.update_user(
        db, user_id, AdminUserUpdate(is_verified=True), admin_user.id
    )

    return AdminBaseResponse(message="User verified successfully")


# ================================
# Role Management
# ================================


@router.get("/users/{user_id}/roles")
async def get_user_roles(
    user_id: UUID = Depends(validate_target_user_access),
    admin_user: AdminUser = Depends(
        require_admin_permission(AdminPermissions.ROLES_READ)
    ),
    db: Database = Depends(get_db),
):
    """Get user's roles and permissions"""

    from app.auth.rbac import RBACCRUD

    roles = await RBACCRUD.get_user_roles(db, user_id)
    permissions = await RBACCRUD.get_user_permissions(db, user_id)

    return {
        "user_id": user_id,
        "roles": roles,
        "permissions": [perm["name"] for perm in permissions],
    }


@router.post("/users/{user_id}/roles/{role_id}", response_model=AdminBaseResponse)
async def assign_role_to_user(
    user_id: UUID = Depends(validate_target_user_access),
    role_id: UUID = Depends(validate_role_assignment),
    admin_user: AdminUser = Depends(
        require_admin_permission(AdminPermissions.ROLES_ASSIGN)
    ),
    db: Database = Depends(get_db),
):
    """Assign role to user"""

    result = await AdminUserService.assign_role(db, user_id, role_id, admin_user.id)

    return AdminBaseResponse(success=result, message="Role assigned successfully")


@router.post(
    "/users/{user_id}/roles/by-name/{role_name}", response_model=AdminBaseResponse
)
async def assign_role_to_user_by_name(
    user_id: UUID = Depends(validate_target_user_access),
    role_name: str = None,
    admin_user: AdminUser = Depends(
        require_admin_permission(AdminPermissions.ROLES_ASSIGN)
    ),
    db: Database = Depends(get_db),
):
    from app.auth.rbac import RoleCRUD

    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    if not admin_user.can_assign_role(role["name"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permission to assign role",
        )
    result = await AdminUserService.assign_role(db, user_id, role["id"], admin_user.id)
    return AdminBaseResponse(success=result, message="Role assigned successfully")


@router.delete("/users/{user_id}/roles/{role_id}", response_model=AdminBaseResponse)
async def remove_role_from_user(
    user_id: UUID = Depends(validate_target_user_access),
    role_id: UUID = Depends(validate_role_assignment),
    admin_user: AdminUser = Depends(
        require_admin_permission(AdminPermissions.ROLES_REVOKE)
    ),
    db: Database = Depends(get_db),
):
    """Remove role from user - System users' super_admin role is protected"""

    result = await AdminUserService.revoke_role(db, user_id, role_id, admin_user.id)

    return AdminBaseResponse(success=result, message="Role removed successfully")


@router.delete(
    "/users/{user_id}/roles/by-name/{role_name}", response_model=AdminBaseResponse
)
async def remove_role_from_user_by_name(
    user_id: UUID = Depends(validate_target_user_access),
    role_name: str = None,
    admin_user: AdminUser = Depends(
        require_admin_permission(AdminPermissions.ROLES_REVOKE)
    ),
    db: Database = Depends(get_db),
):
    from app.auth.rbac import RoleCRUD

    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )
    result = await AdminUserService.revoke_role(db, user_id, role["id"], admin_user.id)
    return AdminBaseResponse(success=result, message="Role removed successfully")


# ================================


# ================================


# ================================


# ================================


# ================================


# ================================
