from typing import List, Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy import and_, select

from app.auth.crud import UserCRUD
from app.auth.dependencies import CurrentUser, require_permissions, require_verified_user
from app.auth.models import (
    permissions,
    role_permissions,
    roles,
    user_roles,
)
from app.auth.rbac import RBACCRUD, RoleCRUD
from app.database import get_db
from app.admin.service import AdminUserService
from app.admin.crud import AdminUserCRUD
from app.admin.schemas import (
    AdminBaseResponse,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    PaginationParams,
    UserSearchFilters,
    PaginatedResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin (RBAC)"])


def _normalize_admin_user(enriched: dict) -> dict:
    """Ensure roles and permissions are lists of strings for AdminUserResponse."""
    data = dict(enriched)
    roles_val = data.get("roles")
    if isinstance(roles_val, list):
        norm_roles: List[str] = []
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
        norm_perms: List[str] = []
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

@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    payload: AdminUserCreate,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:create", require_all=False)),
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
    return AdminUserResponse(**_normalize_admin_user(enriched))


@router.get("/users", response_model=PaginatedResponse)
async def admin_list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:read", require_all=False)),
):
    pagination = PaginationParams(page=page, size=size)
    filters = UserSearchFilters(
        search=search,
        is_active=is_active,
        is_verified=is_verified,
        is_system_user=None,
    )
    items, total = await AdminUserService.get_users_paginated(db, pagination, filters)
    # Normalize each item and convert to Pydantic models for safe serialization
    items = [AdminUserResponse(**_normalize_admin_user(u)) for u in items]
    pages = (total + size - 1) // size
    return PaginatedResponse(
        items=items, total=total, page=page, size=size, pages=pages, has_next=page < pages, has_prev=page > 1
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def admin_get_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:read", require_all=False)),
):
    user = await AdminUserCRUD.get_user_with_roles(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserResponse(**_normalize_admin_user(user))


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def admin_update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:update", require_all=False)),
):
    updated = await AdminUserService.update_user(db, user_id, payload, admin.id)
    enriched = await AdminUserCRUD.get_user_with_roles(db, user_id)
    return AdminUserResponse(**_normalize_admin_user(enriched))


@router.delete("/users/{user_id}", response_model=AdminBaseResponse)
async def admin_delete_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:delete", require_all=False)),
):
    result = await AdminUserService.delete_user(db, user_id, admin.id)
    return AdminBaseResponse(success=result, message="User deleted successfully")


@router.post("/users/{user_id}/resend-invite", response_model=AdminBaseResponse)
async def admin_resend_invite(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:update", require_all=False)),
):
    await AdminUserService.resend_invite(db, user_id, admin.id, background_tasks)
    return AdminBaseResponse(message="Invitation sent")


@router.patch("/users/{user_id}/activate", response_model=AdminBaseResponse)
async def admin_activate_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:update", require_all=False)),
):
    user = await UserCRUD.update(db, user_id, {"is_active": True})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User activated successfully")


@router.patch("/users/{user_id}/deactivate", response_model=AdminBaseResponse)
async def admin_deactivate_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:update", require_all=False)),
):
    user = await UserCRUD.update(db, user_id, {"is_active": False})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User deactivated successfully")


@router.patch("/users/{user_id}/suspend", response_model=AdminBaseResponse)
async def admin_suspend_user(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("users:update", require_all=False)),
):
    # For now, suspend == deactivate (no suspended_until column available)
    user = await UserCRUD.update(db, user_id, {"is_active": False})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminBaseResponse(message="User suspended (deactivated)")


@router.get("/users/{user_id}/roles")
async def admin_get_user_roles_permissions(
    user_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("roles:read", require_all=False)),
):
    # Roles
    roles_query = (
        select(roles.c.name)
        .select_from(user_roles.join(roles, roles.c.id == user_roles.c.role_id))
        .where(and_(user_roles.c.user_id == user_id, user_roles.c.is_active == True))
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
            .join(permissions, permissions.c.id == role_permissions.c.permission_id)
        )
        .where(and_(user_roles.c.user_id == user_id, permissions.c.is_active == True))
        .distinct()
        .order_by(permissions.c.resource, permissions.c.action)
    )
    perm_rows = await db.fetch_all(perms_query)
    perm_names = [f"{p['resource']}:{p['action']}" for p in perm_rows]

    return {"user_id": str(user_id), "roles": role_names, "permissions": perm_names}


@router.post("/users/{user_id}/roles/{role_name}", response_model=AdminBaseResponse)
async def admin_assign_role_by_name(
    user_id: UUID,
    role_name: str,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("roles:assign", require_all=False)),
):
    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    await RBACCRUD.assign_role_to_user(db, user_id, role["id"], assigned_by=admin.id)
    return AdminBaseResponse(message="Role assigned successfully")


@router.delete("/users/{user_id}/roles/{role_name}", response_model=AdminBaseResponse)
async def admin_revoke_role_by_name(
    user_id: UUID,
    role_name: str,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_permissions("roles:revoke", require_all=False)),
):
    role = await RoleCRUD.get_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    result = await RBACCRUD.remove_role_from_user(db, user_id, role["id"], removed_by=admin.id)
    if not result:
        raise HTTPException(status_code=400, detail="Role removal failed or role not assigned")
    return AdminBaseResponse(message="Role revoked successfully")
