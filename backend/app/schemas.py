"""
Global Pydantic schemas for common functionality
This module provides reusable schemas that can be used across all modules
"""

from datetime import UTC, datetime
from enum import Enum
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# ================================
# Base Response Schemas
# ================================


class BaseResponse(BaseModel):
    """Base response schema with common fields"""

    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ErrorResponse(BaseModel):
    """Error response schema"""

    success: bool = False
    error: str
    error_code: str | None = None
    details: dict[str, Any] | None = None
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )


class SuccessResponse(BaseResponse):
    """Success response schema"""

    data: dict[str, Any] | None = None


# ================================
# Pagination Schemas
# ================================


class PaginationParams(BaseModel):
    """Common pagination parameters"""

    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="appointments per page")


class SortParams(BaseModel):
    """Common sorting parameters"""

    sort_by: str | None = Field(None, description="Field to sort by")
    sort_order: str = Field("desc", description="Sort order")


class SearchParams(BaseModel):
    """Common search parameters"""

    search: str | None = Field(
        None, min_length=1, max_length=100, description="Search term"
    )


class FilterParams(BaseModel):
    """Common filtering parameters"""

    is_active: bool | None = Field(None, description="Filter by active status")
    created_after: datetime | None = Field(
        None, description="Filter by creation date (after)"
    )
    created_before: datetime | None = Field(
        None, description="Filter by creation date (before)"
    )

    @field_validator("created_before")
    @classmethod
    def validate_date_range(cls, v, info):
        if hasattr(info, "data") and info.data:
            created_after = info.data.get("created_after")
            if created_after and v and v < created_after:
                raise ValueError("created_before must be after created_after")
        return v


class PaginationMeta(BaseModel):
    """Pagination metadata"""

    total: int = Field(..., description="Total number of appointments")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="appointments per page")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


# Generic paginated response
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""

    appointments: list[T]
    meta: PaginationMeta


# ================================
# Bulk Operation Schemas
# ================================


class BulkOperationType(str, Enum):
    """Common bulk operation types"""

    DELETE = "delete"
    ACTIVATE = "activate"
    DEACTIVATE = "deactivate"
    ARCHIVE = "archive"
    RESTORE = "restore"
    UPDATE = "update"


class BulkOperationRequest(BaseModel):
    """Base bulk operation request"""

    item_ids: list[UUID] = Field(
        ..., min_length=1, max_length=1000, description="List of item IDs"
    )
    operation: BulkOperationType = Field(..., description="Operation to perform")
    reason: str | None = Field(
        None, max_length=500, description="Reason for bulk operation"
    )
    confirm: bool = Field(
        False, description="Confirmation flag for destructive operations"
    )

    @field_validator("confirm")
    @classmethod
    def validate_confirmation(cls, v, info):
        if hasattr(info, "data") and info.data:
            operation = info.data.get("operation")
            destructive_ops = [BulkOperationType.DELETE, BulkOperationType.ARCHIVE]

            if operation in destructive_ops and not v:
                raise ValueError(f"Confirmation required for {operation} operation")

        return v


class BulkOperationResult(BaseModel):
    """Bulk operation result"""

    total_appointments: int = Field(
        ..., description="Total number of appointments processed"
    )
    successful_appointments: int = Field(
        ..., description="Number of successfully processed appointments"
    )
    failed_appointments: int = Field(..., description="Number of failed appointments")
    operation: BulkOperationType = Field(..., description="Operation performed")
    errors: list[dict[str, Any]] = Field(
        default_factory=list, description="List of errors"
    )
    processed_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_appointments == 0:
            return 0.0
        return (self.successful_appointments / self.total_appointments) * 100


# ================================
# Status Update Schemas
# ================================


class StatusUpdate(BaseModel):
    """Generic status update schema"""

    status: str = Field(..., description="New status")
    reason: str | None = Field(
        None, max_length=500, description="Reason for status change"
    )
    effective_date: datetime | None = Field(
        None, description="When the status change takes effect"
    )


class ActivationRequest(BaseModel):
    """Request to activate/deactivate a resource"""

    is_active: bool = Field(..., description="Active status")
    reason: str | None = Field(
        None, max_length=500, description="Reason for status change"
    )


# ================================
# Audit and Activity Schemas
# ================================


class ActivityType(str, Enum):
    """Common activity types"""

    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"


class ActivityLog(BaseModel):
    """Activity log entry"""

    id: UUID
    user_id: UUID | None = None
    activity_type: ActivityType
    resource_type: str
    resource_id: UUID | None = None
    description: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ================================
# Permission and Role Schemas
# ================================


class PermissionLevel(str, Enum):
    """Permission levels"""

    NONE = "none"
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    OWNER = "owner"


class ResourcePermission(BaseModel):
    """Resource permission schema"""

    resource_type: str = Field(..., description="Type of resource")
    resource_id: UUID | None = Field(
        None, description="Specific resource ID (null for all)"
    )
    permission_level: PermissionLevel = Field(..., description="Permission level")
    granted_by: UUID = Field(..., description="Who granted the permission")
    granted_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )
    expires_at: datetime | None = Field(None, description="When permission expires")


class RoleAssignment(BaseModel):
    """Role assignment schema"""

    user_id: UUID
    role_id: UUID
    assigned_by: UUID
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime | None = None
    is_temporary: bool = Field(
        False, description="Whether this is a temporary assignment"
    )


# ================================
# File and Media Schemas
# ================================


class FileInfo(BaseModel):
    """File information schema"""

    filename: str
    content_type: str
    size: int
    checksum: str | None = None
    url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class FileUploadResponse(BaseModel):
    """File upload response"""

    file_id: UUID
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ================================
# Notification Schemas
# ================================


class NotificationType(str, Enum):
    """Notification types"""

    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    SYSTEM = "system"


class NotificationChannel(str, Enum):
    """Notification channels"""

    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class NotificationRequest(BaseModel):
    """Notification request schema"""

    recipient_id: UUID
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    notification_type: NotificationType = NotificationType.INFO
    channels: list[NotificationChannel] = Field(
        default_factory=lambda: [NotificationChannel.IN_APP]
    )
    metadata: dict[str, Any] = Field(default_factory=dict)
    scheduled_for: datetime | None = None


# ================================
# Analytics and Metrics Schemas
# ================================


class MetricType(str, Enum):
    """Metric types"""

    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"


class MetricPoint(BaseModel):
    """Single metric data point"""

    timestamp: datetime
    value: float
    tags: dict[str, str] = Field(default_factory=dict)


class MetricSeries(BaseModel):
    """Time series metric data"""

    name: str
    metric_type: MetricType
    description: str | None = None
    unit: str | None = None
    data_points: list[MetricPoint]


class AnalyticsQuery(BaseModel):
    """Analytics query parameters"""

    metrics: list[str] = Field(..., description="List of metrics to query")
    start_time: datetime = Field(..., description="Query start time")
    end_time: datetime = Field(..., description="Query end time")
    group_by: list[str] | None = Field(None, description="Fields to group by")
    filters: dict[str, Any] = Field(
        default_factory=dict, description="Additional filters"
    )
    aggregation: str = Field("sum", description="Aggregation method")


# ================================
# Export and Import Schemas
# ================================


class ExportFormat(str, Enum):
    """Export formats"""

    JSON = "json"
    CSV = "csv"
    XLSX = "xlsx"
    PDF = "pdf"
    XML = "xml"


class ExportRequest(BaseModel):
    """Export request schema"""

    resource_type: str = Field(..., description="Type of resource to export")
    format: ExportFormat = Field(ExportFormat.JSON, description="Export format")
    filters: dict[str, Any] = Field(default_factory=dict, description="Export filters")
    fields: list[str] | None = Field(None, description="Specific fields to export")
    include_metadata: bool = Field(True, description="Include metadata in export")
    compress: bool = Field(False, description="Compress the export file")


class ExportResponse(BaseModel):
    """Export response schema"""

    export_id: UUID
    status: str = Field("pending", description="Export status")
    download_url: str | None = None
    file_size: int | None = None
    record_count: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    expires_at: datetime | None = None


# ================================
# Health Check Schemas
# ================================


class HealthStatus(str, Enum):
    """Health check status"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class ComponentHealth(BaseModel):
    """Individual component health"""

    name: str
    status: HealthStatus
    response_time: float | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    last_checked: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SystemHealth(BaseModel):
    """Overall system health"""

    status: HealthStatus
    components: list[ComponentHealth]
    overall_response_time: float | None = None
    uptime: int | None = None
    version: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


# ================================
# Configuration Schemas
# ================================


class ConfigurationUpdate(BaseModel):
    """Configuration update schema"""

    section: str = Field(..., description="Configuration section")
    key: str = Field(..., description="Configuration key")
    value: Any = Field(..., description="New configuration value")
    reason: str | None = Field(None, max_length=500, description="Reason for change")
    apply_immediately: bool = Field(True, description="Apply change immediately")


class ConfigurationHistory(BaseModel):
    """Configuration change history"""

    id: UUID
    section: str
    key: str
    old_value: Any | None = None
    new_value: Any
    changed_by: UUID
    reason: str | None = None
    changed_at: datetime
    applied_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
