"""
Admin module Pydantic schemas
"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.auth.schemas import UserRead


class AdminActionType(str, Enum):
    """Types of admin actions for audit logging"""

    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    ACTIVATE = "activate"
    DEACTIVATE = "deactivate"
    ASSIGN_ROLE = "assign_role"
    REVOKE_ROLE = "revoke_role"
    BULK_OPERATION = "bulk_operation"
    EXPORT = "export"
    LOGIN = "login"
    LOGOUT = "logout"
    SYSTEM_CONFIG = "system_config"
    MAINTENANCE = "maintenance"


class SortOrder(str, Enum):
    """Sort order options"""

    ASC = "asc"
    DESC = "desc"


class ExportFormat(str, Enum):
    """Export format options"""

    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"


# Base schemas
class AdminBaseResponse(BaseModel):
    """Base response schema for admin operations"""

    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginationParams(BaseModel):
    """Pagination parameters"""

    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")
    sort_by: str | None = Field(None, description="Field to sort by")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort order")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""

    users: list[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# User Management Schemas
class AdminUserCreate(BaseModel):
    """Schema for admin user creation"""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(..., description="User email address")
    is_active: bool = Field(True, description="User active status")
    is_verified: bool = Field(False, description="User verification status")
    send_welcome_email: bool = Field(True, description="Send welcome email to user")
    # Accept role names or IDs; backend will resolve names to IDs
    roles: list[str] | None = Field(
        None, description="Initial roles to assign (names or IDs)"
    )


class AdminUserUpdate(BaseModel):
    """Schema for admin user updates"""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = Field(None, description="User email address")
    is_active: bool | None = Field(None, description="User active status")
    is_verified: bool | None = Field(None, description="User verification status")


class AdminUserResponse(UserRead):
    """Extended user response for admin operations"""

    roles: list[str] = Field(default_factory=list, description="User roles")
    permissions: list[str] = Field(default_factory=list, description="User permissions")
    last_login: datetime | None = Field(None, description="Last login timestamp")
    login_count: int = Field(0, description="Total login count")
    created_by: UUID | None = Field(None, description="Created by admin ID")
    updated_by: UUID | None = Field(None, description="Last updated by admin ID")


class BulkUserOperation(BaseModel):
    """Schema for bulk user operations"""

    user_ids: list[UUID] = Field(
        ..., min_length=1, max_length=1000, description="List of user IDs"
    )
    operation: str = Field(..., description="Operation to perform")
    parameters: dict[str, Any] | None = Field(None, description="Operation parameters")


class BulkOperationResult(BaseModel):
    """Result of bulk operation"""

    total_appointments: int
    successful_appointments: int
    failed_appointments: int
    errors: list[dict[str, Any]] = Field(default_factory=list)
    details: dict[str, Any] | None = None


# Role Management Schemas
class AdminRoleCreate(BaseModel):
    """Schema for role creation"""

    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    display_name: str = Field(
        ..., min_length=1, max_length=200, description="Role display name"
    )
    description: str | None = Field(
        None, max_length=500, description="Role description"
    )
    permissions: list[UUID] = Field(default_factory=list, description="Permission IDs")
    is_active: bool = Field(True, description="Role active status")


class AdminRoleUpdate(BaseModel):
    """Schema for role updates"""

    name: str | None = Field(None, min_length=1, max_length=100)
    display_name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class AdminRoleResponse(BaseModel):
    """Role response schema"""

    id: UUID
    name: str
    display_name: str
    description: str | None
    is_active: bool
    is_system: bool
    permissions: list[str] = Field(default_factory=list)
    user_count: int = Field(0, description="Number of users with this role")
    created_at: datetime
    updated_at: datetime | None
    created_by: UUID | None
    updated_by: UUID | None


class RoleAssignment(BaseModel):
    """Schema for role assignment"""

    user_id: UUID
    role_id: UUID
    assigned_by: UUID | None = None
    expires_at: datetime | None = None


# Permission Management Schemas
class AdminPermissionCreate(BaseModel):
    """Schema for permission creation"""

    name: str = Field(..., min_length=1, max_length=100, description="Permission name")
    display_name: str = Field(
        ..., min_length=1, max_length=200, description="Permission display name"
    )
    description: str | None = Field(
        None, max_length=500, description="Permission description"
    )
    resource: str = Field(..., description="Resource this permission applies to")
    action: str = Field(..., description="Action this permission allows")
    is_active: bool = Field(True, description="Permission active status")


class AdminPermissionUpdate(BaseModel):
    """Schema for permission updates"""

    display_name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class AdminPermissionResponse(BaseModel):
    """Permission response schema"""

    id: UUID
    name: str
    display_name: str
    description: str | None
    resource: str
    action: str
    is_active: bool
    is_system: bool
    role_count: int = Field(0, description="Number of roles with this permission")
    created_at: datetime
    updated_at: datetime | None
    created_by: UUID | None
    updated_by: UUID | None


# System Monitoring Schemas
class SystemStats(BaseModel):
    """System statistics"""

    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    unverified_users: int
    system_users: int
    total_roles: int
    active_roles: int
    total_permissions: int
    active_permissions: int
    recent_logins_24h: int
    recent_registrations_24h: int


class UserAnalytics(BaseModel):
    """User analytics data"""

    registration_trend: list[dict[str, str | int]]
    login_trend: list[dict[str, str | int]]
    user_activity: list[dict[str, str | int]]
    role_distribution: list[dict[str, str | int]]
    geographic_distribution: list[dict[str, str | int]] | None = None


class SystemHealth(BaseModel):
    """System health status"""

    status: str = Field(..., description="Overall system status")
    database: dict[str, Any]
    redis: dict[str, Any] | None = None
    disk_usage: dict[str, Any]
    memory_usage: dict[str, Any]
    cpu_usage: float
    uptime: int
    last_backup: datetime | None = None
    active_sessions: int
    error_rate: float


# Audit Logging Schemas
class AdminAuditLog(BaseModel):
    """Admin audit log entry"""

    id: UUID
    admin_id: UUID
    admin_email: str
    action: AdminActionType
    resource_type: str
    resource_id: str | None = None
    details: dict[str, Any]
    ip_address: str | None = None
    user_agent: str | None = None
    timestamp: datetime
    success: bool
    error_message: str | None = None


class AdminAuditLogCreate(BaseModel):
    """Schema for creating audit log entries"""

    action: AdminActionType
    resource_type: str
    resource_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    user_agent: str | None = None
    success: bool = True
    error_message: str | None = None


# Export Schemas
class ExportRequest(BaseModel):
    """Data export request"""

    export_type: str = Field(..., description="Type of data to export")
    format: ExportFormat = Field(ExportFormat.CSV, description="Export format")
    filters: dict[str, Any] | None = Field(None, description="Export filters")
    include_fields: list[str] | None = Field(None, description="Fields to include")
    exclude_fields: list[str] | None = Field(None, description="Fields to exclude")
    date_range: dict[str, datetime] | None = Field(
        None, description="Date range filter"
    )


class ExportResponse(BaseModel):
    """Export response"""

    export_id: UUID
    status: str
    download_url: str | None = None
    file_size: int | None = None
    record_count: int | None = None
    created_at: datetime
    expires_at: datetime | None = None


# Dashboard Schemas
class DashboardData(BaseModel):
    """Admin dashboard data"""

    system_stats: SystemStats
    user_analytics: UserAnalytics
    system_health: SystemHealth
    recent_activities: list[AdminAuditLog]
    alerts: list[dict[str, Any]] = Field(default_factory=list)
    quick_actions: list[dict[str, Any]] = Field(default_factory=list)


# Search and Filter Schemas
class UserSearchFilters(BaseModel):
    """User search and filter options"""

    search: str | None = Field(None, description="Search term")
    is_active: bool | None = Field(None, description="Filter by active status")
    is_verified: bool | None = Field(None, description="Filter by verification status")
    is_system_user: bool | None = Field(
        None, description="Filter by system user status"
    )
    roles: list[str] | None = Field(None, description="Filter by roles")
    # created_after: Optional[datetime] = Field(None, description="Created after date")
    # created_before: Optional[datetime] = Field(None, description="Created before date")
    # last_login_after: Optional[datetime] = Field(
    #     None, description="Last login after date"
    # )
    # last_login_before: Optional[datetime] = Field(
    #     None, description="Last login before date"
    # )


class AdminActivityFilters(BaseModel):
    """Admin activity search and filter options"""

    admin_id: UUID | None = Field(None, description="Filter by admin ID")
    action: AdminActionType | None = Field(None, description="Filter by action type")
    resource_type: str | None = Field(None, description="Filter by resource type")
    success: bool | None = Field(None, description="Filter by success status")
    date_from: datetime | None = Field(None, description="Date from")
    date_to: datetime | None = Field(None, description="Date to")
    ip_address: str | None = Field(None, description="Filter by IP address")
