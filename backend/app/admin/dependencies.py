"""
Admin module dependencies for authorization and validation
"""

from typing import Callable, List, Optional
from uuid import UUID

from databases import Database
from fastapi import Depends, HTTPException, Request, status

from app.admin.config import (
    AdminLevel,
    AdminRoleHierarchy,
    get_admin_config,
    is_super_admin_required,
    is_system_admin_required,
)
from app.admin.crud import AdminAuditCRUD
from app.admin.exceptions import (
    AdminOnlyError,
    InsufficientPermissionsError,
    SelfModificationError,
    SuperAdminOnlyError,
    SystemAdminOnlyError,
)
from app.admin.schemas import AdminActionType
from app.auth.dependencies import CurrentUser, get_current_user
from app.auth.rbac import RBACCRUD
from app.database import get_db


class AdminUser:
    """Enhanced user object with admin capabilities"""

    def __init__(self, user: CurrentUser, roles: List[str], permissions: List[str]):
        self.id = user.id
        self.email = user.email
        self.first_name = user.first_name
        self.last_name = user.last_name
        self.is_active = user.is_active
        self.is_verified = user.is_verified
        self.is_system_user = getattr(user, "is_system_user", False)
        self.roles = roles
        self.permissions = permissions
        self.created_at = user.created_at

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return (
            AdminLevel.ADMIN in self.roles
            or self.is_super_admin
            or self.is_system_admin
        )

    @property
    def is_super_admin(self) -> bool:
        """Check if user has super admin role"""
        return AdminLevel.SUPER_ADMIN in self.roles or self.is_system_admin

    @property
    def is_system_admin(self) -> bool:
        """Check if user has system admin role"""
        return AdminLevel.SYSTEM_ADMIN in self.roles or self.is_system_user

    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        return AdminRoleHierarchy.has_permission(self.roles, permission)

    def can_modify_user(self, target_user_id: UUID) -> bool:
        """Check if admin can modify target user"""
        # System admins can modify anyone except other system admins
        if self.is_system_admin:
            return True

        # Super admins can modify regular users and admins
        if self.is_super_admin:
            return True

        # Regular admins can only modify regular users
        if self.is_admin:
            return True

        return False

    def can_assign_role(self, role_name: str) -> bool:
        """Check if admin can assign specific role"""
        config = get_admin_config()
        # System admins can assign any role
        if self.is_system_admin:
            return True

        # Super admins can assign admin roles but not system admin
        if self.is_super_admin:
            return role_name != AdminLevel.SYSTEM_ADMIN

        # Regular admins: allowed to assign roles except admin/super_admin/system_admin
        # However, if policy allows, they may assign 'admin' as well
        if self.is_admin:
            if role_name in [AdminLevel.SUPER_ADMIN, AdminLevel.SYSTEM_ADMIN]:
                return False
            if role_name == AdminLevel.ADMIN:
                return config.ALLOW_ADMIN_TO_CREATE_ADMINS
            return True

        return False


async def get_admin_user(
    current_user: CurrentUser = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> AdminUser:
    """Get current user with admin capabilities"""

    # Get user roles and permissions
    user_roles = await RBACCRUD.get_user_roles(db, current_user.id)
    user_permissions = await RBACCRUD.get_user_permissions(db, current_user.id)

    role_names = [role["name"] for role in user_roles]
    permission_names = [perm["name"] for perm in user_permissions]

    admin_user = AdminUser(current_user, role_names, permission_names)

    # Check if user has any admin role
    if not admin_user.is_admin:
        raise AdminOnlyError("Admin access required")

    return admin_user


def require_admin_permission(permission: str) -> Callable:
    """Dependency factory for requiring specific admin permission"""

    async def permission_checker(
        request: Request,
        admin_user: AdminUser = Depends(get_admin_user),
        db: Database = Depends(get_db),
    ) -> AdminUser:
        # Check if user has required permission
        if not admin_user.has_permission(permission):
            raise InsufficientPermissionsError(
                required_permission=permission, user_permissions=admin_user.permissions
            )

        return admin_user

    return permission_checker


def require_super_admin() -> Callable:
    """Dependency for requiring super admin access"""

    async def super_admin_checker(
        admin_user: AdminUser = Depends(get_admin_user),
    ) -> AdminUser:
        if not admin_user.is_super_admin:
            raise SuperAdminOnlyError()

        return admin_user

    return super_admin_checker


def require_system_admin() -> Callable:
    """Dependency for requiring system admin access"""

    async def system_admin_checker(
        admin_user: AdminUser = Depends(get_admin_user),
    ) -> AdminUser:
        if not admin_user.is_system_admin:
            raise SystemAdminOnlyError()

        return admin_user

    return system_admin_checker


def require_permission_level(permission: str) -> Callable:
    """Smart dependency that checks permission level requirements"""

    async def level_checker(
        request: Request,
        admin_user: AdminUser = Depends(get_admin_user),
        db: Database = Depends(get_db),
    ) -> AdminUser:
        # Check if system admin is required
        if is_system_admin_required(permission):
            if not admin_user.is_system_admin:
                raise SystemAdminOnlyError(f"System admin required for: {permission}")

        # Check if super admin is required
        elif is_super_admin_required(permission):
            if not admin_user.is_super_admin:
                raise SuperAdminOnlyError(f"Super admin required for: {permission}")

        # Check general permission
        elif not admin_user.has_permission(permission):
            raise InsufficientPermissionsError(
                required_permission=permission, user_permissions=admin_user.permissions
            )

        return admin_user

    return level_checker


async def validate_target_user_access(
    target_user_id: UUID,
    admin_user: AdminUser = Depends(get_admin_user),
    db: Database = Depends(get_db),
) -> UUID:
    """Validate that admin can access/modify target user"""

    # Prevent self-modification for certain operations
    if target_user_id == admin_user.id:
        raise SelfModificationError("modify")

    # Get target user info
    from app.auth.crud import UserCRUD

    target_user = await UserCRUD.get_by_id(db, target_user_id)

    if not target_user:
        from app.admin.exceptions import UserNotFoundError

        raise UserNotFoundError(str(target_user_id))

    # Check if admin can modify this user
    if not admin_user.can_modify_user(target_user_id):
        raise InsufficientPermissionsError(
            required_permission="user:modify", user_permissions=admin_user.permissions
        )

    # Additional protection for system users
    if target_user.get("is_system_user", False) and not admin_user.is_system_admin:
        from app.admin.exceptions import SystemUserProtectedError

        raise SystemUserProtectedError(
            user_email=target_user["email"], operation="modify"
        )

    return target_user_id


async def validate_role_assignment(
    role_id: UUID,
    admin_user: AdminUser = Depends(get_admin_user),
    db: Database = Depends(get_db),
) -> UUID:
    """Validate that admin can assign specific role"""

    # Get role info
    from app.auth.rbac import RoleCRUD

    role = await RoleCRUD.get_by_id(db, role_id)

    if not role:
        from app.admin.exceptions import RoleNotFoundError

        raise RoleNotFoundError(str(role_id))

    # Check if admin can assign this role
    if not admin_user.can_assign_role(role["name"]):
        raise InsufficientPermissionsError(
            required_permission=f"role:assign:{role['name']}",
            user_permissions=admin_user.permissions,
        )

    return role_id


# Convenience dependencies for common permission checks
RequireUsersList = Depends(require_admin_permission("users:list"))
RequireUsersRead = Depends(require_admin_permission("users:read"))
# Allow admins with users:create permission to create users
RequireUsersCreate = Depends(require_admin_permission("users:create"))
RequireUsersUpdate = Depends(require_admin_permission("users:update"))
# Restrict delete to super admin only
RequireUsersDelete = Depends(require_super_admin())
RequireRolesManage = Depends(require_super_admin())
RequireSystemMonitor = Depends(require_admin_permission("system:monitor"))
RequireSystemConfig = Depends(require_system_admin())
RequireAnalytics = Depends(require_admin_permission("analytics:view"))
