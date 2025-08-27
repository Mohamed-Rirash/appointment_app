"""
Admin module Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, validator, EmailStr

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
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort order")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
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
    roles: Optional[List[str]] = Field(None, description="Initial roles to assign (names or IDs)")


class AdminUserUpdate(BaseModel):
    """Schema for admin user updates"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = Field(None, description="User email address")
    is_active: Optional[bool] = Field(None, description="User active status")
    is_verified: Optional[bool] = Field(None, description="User verification status")


class AdminUserResponse(UserRead):
    """Extended user response for admin operations"""
    roles: List[str] = Field(default_factory=list, description="User roles")
    permissions: List[str] = Field(default_factory=list, description="User permissions")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    login_count: int = Field(0, description="Total login count")
    created_by: Optional[UUID] = Field(None, description="Created by admin ID")
    updated_by: Optional[UUID] = Field(None, description="Last updated by admin ID")


class BulkUserOperation(BaseModel):
    """Schema for bulk user operations"""
    user_ids: List[UUID] = Field(..., min_length=1, max_length=1000, description="List of user IDs")
    operation: str = Field(..., description="Operation to perform")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Operation parameters")


class BulkOperationResult(BaseModel):
    """Result of bulk operation"""
    total_items: int
    successful_items: int
    failed_items: int
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    details: Optional[Dict[str, Any]] = None


# Role Management Schemas
class AdminRoleCreate(BaseModel):
    """Schema for role creation"""
    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    display_name: str = Field(..., min_length=1, max_length=200, description="Role display name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    permissions: List[UUID] = Field(default_factory=list, description="Permission IDs")
    is_active: bool = Field(True, description="Role active status")


class AdminRoleUpdate(BaseModel):
    """Schema for role updates"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class AdminRoleResponse(BaseModel):
    """Role response schema"""
    id: UUID
    name: str
    display_name: str
    description: Optional[str]
    is_active: bool
    is_system: bool
    permissions: List[str] = Field(default_factory=list)
    user_count: int = Field(0, description="Number of users with this role")
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[UUID]
    updated_by: Optional[UUID]


class RoleAssignment(BaseModel):
    """Schema for role assignment"""
    user_id: UUID
    role_id: UUID
    assigned_by: Optional[UUID] = None
    expires_at: Optional[datetime] = None


# Permission Management Schemas
class AdminPermissionCreate(BaseModel):
    """Schema for permission creation"""
    name: str = Field(..., min_length=1, max_length=100, description="Permission name")
    display_name: str = Field(..., min_length=1, max_length=200, description="Permission display name")
    description: Optional[str] = Field(None, max_length=500, description="Permission description")
    resource: str = Field(..., description="Resource this permission applies to")
    action: str = Field(..., description="Action this permission allows")
    is_active: bool = Field(True, description="Permission active status")


class AdminPermissionUpdate(BaseModel):
    """Schema for permission updates"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class AdminPermissionResponse(BaseModel):
    """Permission response schema"""
    id: UUID
    name: str
    display_name: str
    description: Optional[str]
    resource: str
    action: str
    is_active: bool
    is_system: bool
    role_count: int = Field(0, description="Number of roles with this permission")
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[UUID]
    updated_by: Optional[UUID]


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
    registration_trend: List[Dict[str, Union[str, int]]]
    login_trend: List[Dict[str, Union[str, int]]]
    user_activity: List[Dict[str, Union[str, int]]]
    role_distribution: List[Dict[str, Union[str, int]]]
    geographic_distribution: Optional[List[Dict[str, Union[str, int]]]] = None


class SystemHealth(BaseModel):
    """System health status"""
    status: str = Field(..., description="Overall system status")
    database: Dict[str, Any]
    redis: Optional[Dict[str, Any]] = None
    disk_usage: Dict[str, Any]
    memory_usage: Dict[str, Any]
    cpu_usage: float
    uptime: int
    last_backup: Optional[datetime] = None
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
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    success: bool
    error_message: Optional[str] = None


class AdminAuditLogCreate(BaseModel):
    """Schema for creating audit log entries"""
    action: AdminActionType
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None


# Export Schemas
class ExportRequest(BaseModel):
    """Data export request"""
    export_type: str = Field(..., description="Type of data to export")
    format: ExportFormat = Field(ExportFormat.CSV, description="Export format")
    filters: Optional[Dict[str, Any]] = Field(None, description="Export filters")
    include_fields: Optional[List[str]] = Field(None, description="Fields to include")
    exclude_fields: Optional[List[str]] = Field(None, description="Fields to exclude")
    date_range: Optional[Dict[str, datetime]] = Field(None, description="Date range filter")


class ExportResponse(BaseModel):
    """Export response"""
    export_id: UUID
    status: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    record_count: Optional[int] = None
    created_at: datetime
    expires_at: Optional[datetime] = None


# Dashboard Schemas
class DashboardData(BaseModel):
    """Admin dashboard data"""
    system_stats: SystemStats
    user_analytics: UserAnalytics
    system_health: SystemHealth
    recent_activities: List[AdminAuditLog]
    alerts: List[Dict[str, Any]] = Field(default_factory=list)
    quick_actions: List[Dict[str, Any]] = Field(default_factory=list)


# Search and Filter Schemas
class UserSearchFilters(BaseModel):
    """User search and filter options"""
    search: Optional[str] = Field(None, description="Search term")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    is_verified: Optional[bool] = Field(None, description="Filter by verification status")
    is_system_user: Optional[bool] = Field(None, description="Filter by system user status")
    roles: Optional[List[str]] = Field(None, description="Filter by roles")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    last_login_after: Optional[datetime] = Field(None, description="Last login after date")
    last_login_before: Optional[datetime] = Field(None, description="Last login before date")


class AdminActivityFilters(BaseModel):
    """Admin activity search and filter options"""
    admin_id: Optional[UUID] = Field(None, description="Filter by admin ID")
    action: Optional[AdminActionType] = Field(None, description="Filter by action type")
    resource_type: Optional[str] = Field(None, description="Filter by resource type")
    success: Optional[bool] = Field(None, description="Filter by success status")
    date_from: Optional[datetime] = Field(None, description="Date from")
    date_to: Optional[datetime] = Field(None, description="Date to")
    ip_address: Optional[str] = Field(None, description="Filter by IP address")
