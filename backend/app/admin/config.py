from enum import Enum

from pydantic import BaseModel

from app.config import get_settings

settings = get_settings()


class AdminLevel(str, Enum):
    """Admin access levels"""

    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    SYSTEM_ADMIN = "system_admin"


class AdminPermissions:
    """Admin permission constants"""

    # User Management
    USERS_LIST = "users:list"
    USERS_READ = "users:read"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"
    USERS_ACTIVATE = "users:activate"
    USERS_DEACTIVATE = "users:deactivate"
    USERS_BULK_OPERATIONS = "users:bulk"

    # Role Management
    ROLES_LIST = "roles:list"
    ROLES_READ = "roles:read"
    ROLES_CREATE = "roles:create"
    ROLES_UPDATE = "roles:update"
    ROLES_DELETE = "roles:delete"
    ROLES_ASSIGN = "roles:assign"
    ROLES_REVOKE = "roles:revoke"

    # Permission Management
    PERMISSIONS_LIST = "permissions:list"
    PERMISSIONS_READ = "permissions:read"
    PERMISSIONS_CREATE = "permissions:create"
    PERMISSIONS_UPDATE = "permissions:update"
    PERMISSIONS_DELETE = "permissions:delete"

    # System Monitoring
    SYSTEM_MONITOR = "system:monitor"
    SYSTEM_HEALTH = "system:health"
    SYSTEM_METRICS = "system:metrics"
    SYSTEM_LOGS = "system:logs"

    # Analytics & Reports
    ANALYTICS_VIEW = "analytics:view"
    ANALYTICS_EXPORT = "analytics:export"
    REPORTS_GENERATE = "reports:generate"

    # Super Admin Only
    SYSTEM_CONFIG = "system:config"
    SYSTEM_MAINTENANCE = "system:maintenance"
    ADMIN_MANAGE = "admin:manage"
    SYSTEM_BACKUP = "system:backup"
    SYSTEM_RESTORE = "system:restore"


class AdminConfig(BaseModel):
    """Admin module configuration"""

    # Pagination defaults
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Bulk operation limits
    MAX_BULK_OPERATIONS: int = 1000

    # Session management
    ADMIN_SESSION_TIMEOUT: int = 3600  # 1 hour

    # Security settings
    REQUIRE_2FA_FOR_ADMIN: bool = False
    LOG_ALL_ADMIN_ACTIONS: bool = True

    # System monitoring
    HEALTH_CHECK_INTERVAL: int = 60  # seconds
    METRICS_RETENTION_DAYS: int = 30

    # Export settings
    MAX_EXPORT_RECORDS: int = 10000
    EXPORT_FORMATS: list[str] = ["csv", "json", "xlsx"]

    # Dashboard settings
    DASHBOARD_REFRESH_INTERVAL: int = 30  # seconds
    RECENT_ACTIVITIES_LIMIT: int = 50

    # User management policy
    # If True, regular admins are allowed to assign the `admin` role to other users.
    # If False, only super admins may assign the `admin` role (default behavior).
    ALLOW_ADMIN_TO_CREATE_ADMINS: bool = False


# Global admin configuration instance
admin_config = AdminConfig()


class AdminRoleHierarchy:
    """Define admin role hierarchy and permissions"""

    ROLE_PERMISSIONS: dict[str, list[str]] = {
        # Admins: user management only (including create), role assignment/revocation.
        AdminLevel.ADMIN: [
            AdminPermissions.USERS_LIST,
            AdminPermissions.USERS_READ,
            AdminPermissions.USERS_CREATE,
            AdminPermissions.USERS_UPDATE,
            AdminPermissions.USERS_ACTIVATE,
            AdminPermissions.USERS_DEACTIVATE,
            # Role assignment (no role create/update/delete)
            AdminPermissions.ROLES_LIST,
            AdminPermissions.ROLES_READ,
            AdminPermissions.ROLES_ASSIGN,
            AdminPermissions.ROLES_REVOKE,
        ],
        # Super admins: focused on user management only, with delete and bulk.
        AdminLevel.SUPER_ADMIN: [
            AdminPermissions.USERS_LIST,
            AdminPermissions.USERS_READ,
            AdminPermissions.USERS_CREATE,
            AdminPermissions.USERS_UPDATE,
            AdminPermissions.USERS_ACTIVATE,
            AdminPermissions.USERS_DEACTIVATE,
            AdminPermissions.USERS_DELETE,
            AdminPermissions.USERS_BULK_OPERATIONS,
            # Role assignment (no role create/update/delete)
            AdminPermissions.ROLES_LIST,
            AdminPermissions.ROLES_READ,
            AdminPermissions.ROLES_ASSIGN,
            AdminPermissions.ROLES_REVOKE,
        ],
        # System admin retains full system-level permissions.
        AdminLevel.SYSTEM_ADMIN: [
            "*",
            AdminPermissions.SYSTEM_CONFIG,
            AdminPermissions.SYSTEM_MAINTENANCE,
            AdminPermissions.SYSTEM_BACKUP,
            AdminPermissions.SYSTEM_RESTORE,
        ],
    }

    @classmethod
    def get_permissions_for_role(cls, role: str) -> list[str]:
        """Get all permissions for a given admin role"""
        permissions = set()

        # Add permissions for the specific role
        if role in cls.ROLE_PERMISSIONS:
            permissions.update(cls.ROLE_PERMISSIONS[role])

        # Add inherited permissions based on hierarchy
        if role == AdminLevel.SUPER_ADMIN:
            permissions.update(cls.ROLE_PERMISSIONS.get(AdminLevel.ADMIN, []))
        elif role == AdminLevel.SYSTEM_ADMIN:
            permissions.update(cls.ROLE_PERMISSIONS.get(AdminLevel.ADMIN, []))
            permissions.update(cls.ROLE_PERMISSIONS.get(AdminLevel.SUPER_ADMIN, []))

        return list(permissions)

    @classmethod
    def has_permission(cls, user_roles: list[str], required_permission: str) -> bool:
        """Check if user has required permission based on roles"""
        user_permissions = set()

        for role in user_roles:
            role_permissions = cls.get_permissions_for_role(role)
            user_permissions.update(role_permissions)

        # Check for wildcard permission (system admin)
        if "*" in user_permissions:
            return True

        return required_permission in user_permissions


class AdminAuditConfig:
    """Configuration for admin audit logging"""

    # Actions that require audit logging
    AUDITED_ACTIONS = [
        "user_create",
        "user_update",
        "user_delete",
        "user_activate",
        "user_deactivate",
        "role_assign",
        "role_revoke",
        "role_create",
        "role_update",
        "role_delete",
        "permission_create",
        "permission_update",
        "permission_delete",
        "system_config_change",
        "admin_login",
        "admin_logout",
        "bulk_operation",
        "data_export",
        "system_maintenance",
    ]

    # Sensitive fields to mask in audit logs
    MASKED_FIELDS = [
        "password",
        "password_hash",
        "secret_key",
        "api_key",
        "token",
        "refresh_token",
    ]

    # Audit log retention period (days)
    AUDIT_RETENTION_DAYS = 365


def get_admin_config() -> AdminConfig:
    """Get admin configuration instance"""
    return admin_config


def is_super_admin_required(permission: str) -> bool:
    """Check if a permission requires super admin access"""
    super_admin_only = [
        AdminPermissions.USERS_CREATE,
        AdminPermissions.USERS_DELETE,
        AdminPermissions.USERS_BULK_OPERATIONS,
        AdminPermissions.ROLES_CREATE,
        AdminPermissions.ROLES_UPDATE,
        AdminPermissions.ROLES_DELETE,
        AdminPermissions.PERMISSIONS_CREATE,
        AdminPermissions.PERMISSIONS_UPDATE,
        AdminPermissions.PERMISSIONS_DELETE,
        AdminPermissions.ADMIN_MANAGE,
    ]

    return permission in super_admin_only


def is_system_admin_required(permission: str) -> bool:
    """Check if a permission requires system admin access"""
    system_admin_only = [
        AdminPermissions.SYSTEM_CONFIG,
        AdminPermissions.SYSTEM_MAINTENANCE,
        AdminPermissions.SYSTEM_BACKUP,
        AdminPermissions.SYSTEM_RESTORE,
    ]

    return permission in system_admin_only
