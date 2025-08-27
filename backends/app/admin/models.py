import uuid
from datetime import datetime

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Table,
    Text,
    UniqueConstraint,
    Index,
    func,
    text,
)

from app.database import metadata

# Admin audit logs
admin_audit_logs = Table(
    "admin_audit_logs",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("admin_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
    Column("action", String(100), nullable=False),
    Column("resource", String(100), nullable=True),
    Column("resource_id", UUID(as_uuid=True), nullable=True),
    Column("details", JSON, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Index("idx_admin_audit_admin", "admin_id"),
    Index("idx_admin_audit_action", "action"),
)

# Admin sessions
admin_sessions = Table(
    "admin_sessions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("admin_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("ip_address", String(45), nullable=True),
    Column("user_agent", Text, nullable=True),
    Column("started_at", DateTime(timezone=True), server_default=func.now()),
    Column("ended_at", DateTime(timezone=True), nullable=True),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Index("idx_admin_sessions_admin", "admin_id"),
)

# System config key/value store
system_config = Table(
    "system_config",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("key", String(100), nullable=False, unique=True),
    Column("value", JSON, nullable=True),
    Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
)

# Data exports tracking
data_exports = Table(
    "data_exports",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("requested_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("status", String(50), nullable=False, server_default=text("'pending'")),
    Column("file_path", String(255), nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column("completed_at", DateTime(timezone=True), nullable=True),
)

# System metrics snapshots
system_metrics = Table(
    "system_metrics",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("metric", String(100), nullable=False),
    Column("value", JSON, nullable=False),
    Column("recorded_at", DateTime(timezone=True), server_default=func.now()),
    Index("idx_system_metrics_metric", "metric"),
)

# Admin notifications
admin_notifications = Table(
    "admin_notifications",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("admin_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("title", String(200), nullable=False),
    Column("message", Text, nullable=False),
    Column("type", String(50), nullable=False, server_default=text("'info'")),
    Column("priority", String(50), nullable=False, server_default=text("'normal'")),
    Column("action_url", String(255), nullable=True),
    Column("action_label", String(100), nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column("read_at", DateTime(timezone=True), nullable=True),
    Index("idx_admin_notifications_admin", "admin_id"),
)

# User activities timeline
user_activities = Table(
    "user_activities",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("activity", String(200), nullable=False),
    Column("metadata", JSON, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Index("idx_user_activities_user", "user_id"),
)

# System alerts (used in utils)
system_alerts = Table(
    "system_alerts",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("alert_type", String(100), nullable=False),
    Column("severity", String(50), nullable=False),
    Column("title", String(200), nullable=False),
    Column("description", Text, nullable=True),
    Column("source", String(100), nullable=False, server_default=text("'system'")),
    Column("metadata", JSON, nullable=True),
    Column("first_occurred", DateTime(timezone=True), server_default=func.now()),
    Column("last_occurred", DateTime(timezone=True), server_default=func.now()),
    Index("idx_system_alerts_type", "alert_type"),
)

# Admin preferences
admin_preferences = Table(
    "admin_preferences",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("admin_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("preferences", JSON, nullable=True),
    Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    UniqueConstraint("admin_id", name="uq_admin_preferences_admin"),
)

# Bulk operations tracking
bulk_operations = Table(
    "bulk_operations",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("operation", String(100), nullable=False),
    Column("status", String(50), nullable=False, server_default=text("'pending'")),
    Column("requested_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("details", JSON, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column("completed_at", DateTime(timezone=True), nullable=True),
)

# System backups
system_backups = Table(
    "system_backups",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("status", String(50), nullable=False, server_default=text("'pending'")),
    Column("location", String(255), nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column("completed_at", DateTime(timezone=True), nullable=True),
)
