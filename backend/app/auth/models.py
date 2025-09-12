import uuid
from datetime import datetime

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
    text,
)

from app.database import metadata

# --- Users Table ---
users = Table(
    "users",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("first_name", String(100), nullable=False),
    Column("last_name", String(100), nullable=False),
    Column("email", String(100), unique=True, nullable=False),
    Column("password", String, nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
    Column("is_active", Boolean, nullable=False, server_default=text("false")),
    Column("is_verified", Boolean, nullable=False, server_default=text("false")),
    Column("verified_at", DateTime(timezone=True), nullable=True),
    Column("is_system_user", Boolean, nullable=False, server_default=text("false")),
)


# --- Roles Table ---
roles = Table(
    "roles",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("name", String(50), nullable=False, unique=True),
    Column("display_name", String(100), nullable=False),
    Column("description", Text, nullable=True),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Column("is_system", Boolean, nullable=False, server_default=text("false")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
    Index("idx_roles_name", "name"),
    Index("idx_roles_active", "is_active"),
)


# --- Permissions Table ---
permissions = Table(
    "permissions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("name", String(100), nullable=False, unique=True),  # e.g. "users:create"
    Column("resource", String(50), nullable=False),  # e.g. "users"
    Column("action", String(50), nullable=False),  # e.g. "create"
    Column("description", Text, nullable=True),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
    Index("idx_permissions_name", "name"),
    Index("idx_permissions_resource_action", "resource", "action"),
    Index("idx_permissions_active", "is_active"),
    UniqueConstraint("resource", "action", name="uq_permissions_resource_action"),
)


# --- Role-Permission Association Table (Many-to-Many) ---
role_permissions = Table(
    "role_permissions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "role_id",
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "permission_id",
        UUID(as_uuid=True),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column("granted_at", DateTime(timezone=True), server_default=func.now()),
    Column("granted_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
    Index("idx_role_permissions_role", "role_id"),
    Index("idx_role_permissions_permission", "permission_id"),
    UniqueConstraint("role_id", "permission_id", name="uq_role_permissions"),
)


# --- User-Role Association Table (Many-to-Many) ---
user_roles = Table(
    "user_roles",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "role_id",
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column("assigned_at", DateTime(timezone=True), server_default=func.now()),
    Column("assigned_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
    Column("expires_at", DateTime(timezone=True), nullable=True),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Index("idx_user_roles_user", "user_id"),
    Index("idx_user_roles_role", "role_id"),
    Index("idx_user_roles_active", "is_active"),
    Index("idx_user_roles_expires", "expires_at"),
    UniqueConstraint("user_id", "role_id", name="uq_user_roles"),
)


# --- UserTokens for auth token tracking ---
user_tokens = Table(
    "user_tokens",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id")),
    Column("access_key", String(250), nullable=True, index=True, default=None),
    Column("refresh_key", String(250), nullable=True, index=True, default=None),
    Column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    ),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)
# --- Default Permissions ---
DEFAULT_PERMISSIONS = [
    # Users
    {"resource": "users", "action": "create", "description": "Create new users"},
    {"resource": "users", "action": "read", "description": "View user details"},
    {"resource": "users", "action": "update", "description": "Edit user information"},
    {"resource": "users", "action": "delete", "description": "Remove users"},
    {"resource": "users", "action": "list", "description": "List all users"},
    # Roles
    {"resource": "roles", "action": "create", "description": "Create new roles"},
    {"resource": "roles", "action": "read", "description": "View role details"},
    {"resource": "roles", "action": "update", "description": "Edit role information"},
    {"resource": "roles", "action": "delete", "description": "Remove roles"},
    {"resource": "roles", "action": "list", "description": "List all roles"},
    {"resource": "roles", "action": "assign", "description": "Assign roles to users"},
    # Permissions
    {
        "resource": "permissions",
        "action": "create",
        "description": "Create permissions",
    },
    {
        "resource": "permissions",
        "action": "read",
        "description": "View permission details",
    },
    {"resource": "permissions", "action": "update", "description": "Edit permissions"},
    {
        "resource": "permissions",
        "action": "delete",
        "description": "Remove permissions",
    },
    {
        "resource": "permissions",
        "action": "list",
        "description": "List all permissions",
    },
    {
        "resource": "permissions",
        "action": "grant",
        "description": "Grant permissions to roles",
    },
    # System
    {"resource": "system", "action": "monitor", "description": "Monitor system status"},
    {
        "resource": "system",
        "action": "configure",
        "description": "Configure system settings",
    },
    {"resource": "system", "action": "logs", "description": "View system logs"},
    # Profile
    {"resource": "profile", "action": "read", "description": "View own profile"},
    {"resource": "profile", "action": "update", "description": "Update own profile"},
    {"resource": "profile", "action": "delete", "description": "Delete own account"},
    # Appointments
    {
        "resource": "appointments",
        "action": "create",
        "description": "Create appointments",
    },
    {
        "resource": "appointments",
        "action": "read",
        "description": "View appointment details",
    },
    {
        "resource": "appointments",
        "action": "list",
        "description": "List all appointments",
    },
    {
        "resource": "appointments",
        "action": "update",
        "description": "Update appointment details",
    },
    {
        "resource": "appointments",
        "action": "delete",
        "description": "Delete appointments",
    },
    {
        "resource": "appointments",
        "action": "approve",
        "description": "Approve appointments",
    },
    {"resource": "appointments", "action": "deny", "description": "Deny appointments"},
    {
        "resource": "appointments",
        "action": "postpone",
        "description": "Postpone appointments",
    },
    {
        "resource": "appointments",
        "action": "*",
        "description": "Full appointment access",
    },
]
