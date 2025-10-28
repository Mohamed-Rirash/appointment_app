from uuid import UUID

from databases import Database
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import and_, select

from app.admin.crud import AdminUserCRUD
from app.admin.schemas import (
    AdminBaseResponse,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    PaginatedResponse,
    PaginationParams,
    UserSearchFilters,
)
from app.admin.service import AdminUserService
from app.auth.crud import UserCRUD
from app.auth.dependencies import (
    CurrentUser,
    require_permissions,
)
from app.auth.models import permissions, role_permissions, roles, user_roles
from app.auth.rbac import RBACCRUD, RoleCRUD
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin (RBAC)"])


def _normalize_admin_user(enriched: dict) -> dict:
    """Ensure roles and permissions are lists of strings for AdminUserResponse."""
    data = dict(enriched)
    roles_val = data.get("roles")
    if isinstance(roles_val, list):
        norm_roles: list[str] = []
        for r in roles_val:
            if isinstance(r, str):
                norm_roles.append(r)
            elif isinstance(r, dict):
                # prefer name, fallback to display_name or id
                name = r.get("name") or r.get("display_name") or r.get("id")
                if name is not None:
                    norm_roles.append(str(name))
        data["roles"] = norm_roles

    perms_val = data.get("permissions")
    if isinstance(perms_val, list):
        norm_perms: list[str] = []
        for p in perms_val:
            if isinstance(p, str):
                norm_perms.append(p)
            elif isinstance(p, dict):
                # build resource:action or use name
                name = p.get("name")
                if name:
                    norm_perms.append(str(name))
                else:
                    res = p.get("resource")
                    act = p.get("action")
                    if res and act:
                        norm_perms.append(f"{res}:{act}")
                    else:
                        pid = p.get("id")
                        if pid is not None:
                            norm_perms.append(str(pid))
        data["permissions"] = norm_perms

    return data


# =============================================================================
# USER MANAGEMENT ENDPOINTS
# =============================================================================


@router.post(
    "/users",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="(only admins) can create a new user with his role",
)
async def admin_create_user(
    payload: AdminUserCreate,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions("users:create", require_all=False)
    ),
):
    """Create a user with optional initial roles and send invite email (Option B)."""
    created = await AdminUserService.create_user(
        db=db,
        user_data=payload,
        created_by=admin.id,
        background_tasks=background_tasks,
    )
    # Return enriched user with roles/permissions
    enriched = await AdminUserCRUD.get_user_with_roles(db, created["id"])
    return AdminUserResponse(**_normalize_admin_user(enriched))  # pyright: ignore[reportArgumentType]


@router.get(
    "/users", response_model=PaginatedResponse, summary="list all users (admins only)"
)
async def admin_list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    is_verified: bool | None = Query(None),
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(require_permissions("users:read", require_all=False)),
):
    pagination = PaginationParams(page=page, size=size)  # pyright: ignore[reportCallIssue]
    filters = UserSearchFilters(  # pyright: ignore[reportCallIssue]
        search=search,
        is_active=is_active,
        is_verified=is_verified,
        is_system_user=None,
    )
    users, total = await AdminUserService.get_users_paginated(db, pagination, filters)
    # Normalize each item and convert to Pydantic models for safe serialization
    users = [AdminUserResponse(**_normalize_admin_user(u)) for u in users]
    pages = (total + size - 1) // size
    return PaginatedResponse(
        users=users,
        total=total,
        page=page,
        size=size,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="get a user by id (admins only)",
)
async def admin_get_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(require_permissions("users:read", require_all=False)),
):
    user = await AdminUserCRUD.get_user_with_roles(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserResponse(**_normalize_admin_user(user))


@router.put(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="update a user by id (admins only)",
)
async def admin_update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions("users:update", require_all=False)
    ),
):
    _updated = await AdminUserService.update_user(db, user_id, payload, admin.id)
    enriched = await AdminUserCRUD.get_user_with_roles(db, user_id)
    return AdminUserResponse(**_normalize_admin_user(enriched))  # pyright: ignore[reportArgumentType]


@router.delete(
    "/users/{user_id}",
    response_model=AdminBaseResponse,
    summary="delete a user by id Note: we can not remove the user the dp becouse we will miss history tracking and reports so it is cold delete(deactiivating it)(admins only)",
)
async def admin_delete_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions(
            "users:delete", "users:update", "admin:*", require_all=False
        )
    ),
):
    result = await AdminUserService.delete_user(db, user_id, admin.id)
    return AdminBaseResponse(success=result, message="User deleted successfully")


@router.post(
    "/users/{user_id}/resend-invite",
    response_model=AdminBaseResponse,
    summary="resend the invitation email to a user (admins only)",
)
async def admin_resend_invite(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions("users:update", require_all=False)
    ),
):
    await AdminUserService.resend_invite(db, user_id, admin.id, background_tasks)
    return AdminBaseResponse(message="Invitation sent")


@router.patch(
    "/users/{user_id}/activate",
    response_model=AdminBaseResponse,
    summary="activate a user (admins only)",
)
async def admin_activate_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(
        require_permissions("users:update", require_all=False)
    ),
):
    user = await UserCRUD.update(db, user_id, {"is_active": True})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User activated successfully")


@router.patch(
    "/users/{user_id}/deactivate",
    response_model=AdminBaseResponse,
    summary="deactivate a user (admins only)",
    deprecated=True,
    description="since delete deactivates we do not need it",
)
async def admin_deactivate_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(
        require_permissions("users:update", require_all=False)
    ),
):
    user = await UserCRUD.update(db, user_id, {"is_active": False})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User deactivated successfully")


@router.patch(
    "/users/{user_id}/suspend",
    response_model=AdminBaseResponse,
    summary="suspend a user (admins only)",
    deprecated=True,
    description="since delete deactivates we do not need it",
)
async def admin_suspend_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(
        require_permissions("users:update", require_all=False)
    ),
):
    # For now, suspend == deactivate (no suspended_until column available)
    user = await UserCRUD.update(db, user_id, {"is_active": False})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User suspended (deactivated)")


@router.get(
    "/users/{user_id}/roles",
    summary="get user roles and permissions if we need to check the role of users by using user id (admins only)",
)
async def admin_get_user_roles_permissions(
    user_id: UUID,
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(require_permissions("roles:read", require_all=False)),
):
    # Roles
    roles_query = (
        select(roles.c.name)
        .select_from(user_roles.join(roles, roles.c.id == user_roles.c.role_id))
        .where(and_(user_roles.c.user_id == user_id, user_roles.c.is_active.is_(True)))
        .order_by(roles.c.name)
    )
    role_rows = await db.fetch_all(roles_query)
    role_names = [r["name"] for r in role_rows]

    # Permissions
    perms_query = (
        select(permissions.c.resource, permissions.c.action)
        .select_from(
            user_roles.join(roles, roles.c.id == user_roles.c.role_id)
            .join(role_permissions, role_permissions.c.role_id == roles.c.id)
            .join(
                permissions,
                permissions.c.id == role_permissions.c.permission_id,
            )
        )
        .where(and_(user_roles.c.user_id == user_id, permissions.c.is_active.is_(True)))
        .distinct()
        .order_by(permissions.c.resource, permissions.c.action)
    )
    perm_rows = await db.fetch_all(perms_query)
    perm_names = [f"{p['resource']}:{p['action']}" for p in perm_rows]

    return {
        "user_id": str(user_id),
        "roles": role_names,
        "permissions": perm_names,
    }


@router.post(
    "/users/{user_id}/roles/{role_name}",
    response_model=AdminBaseResponse,
    deprecated=True,
    summary="assign a role to a user by name (admins only)",
    description="since we assign single role at the begining we do not need",
)
async def admin_assign_role_by_name(
    user_id: UUID,
    role_name: str,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions(
            "roles:assign", "users:update", "admin:*", require_all=False
        )
    ),
):
    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    await RBACCRUD.assign_role_to_user(db, user_id, role["id"], assigned_by=admin.id)
    return AdminBaseResponse(message="Role assigned successfully")


@router.delete(
    "/users/{user_id}/roles/{role_name}",
    response_model=AdminBaseResponse,
    deprecated=True,
    description="we can not remove role",
)
async def admin_revoke_role_by_name(
    user_id: UUID,
    role_name: str,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(
        require_permissions(
            "roles:revoke", "users:update", "admin:*", require_all=False
        )
    ),
):
    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    result = await RBACCRUD.remove_role_from_user(
        db, user_id, role["id"], removed_by=admin.id
    )
    if not result:
        raise HTTPException(
            status_code=400, detail="Role removal failed or role not assigned"
        )
    return AdminBaseResponse(message="Role revoked successfully")


# ================================
# Role Management Endpoints
# ================================


@router.get("/roles", deprecated=True)
async def get_all_roles(
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(require_permissions("roles:read", require_all=False)),
):
    """Get all roles in the system"""
    query = select(roles)
    result = await db.fetch_all(query)
    return [dict(row) for row in result]


@router.get("/permissions", deprecated=True)
async def get_all_permissions(
    db: Database = Depends(get_db),
    _admin: CurrentUser = Depends(
        require_permissions("permissions:read", require_all=False)
    ),
):
    """Get all permissions in the system"""
    query = select(permissions)
    result = await db.fetch_all(query)
    return [dict(row) for row in result]
