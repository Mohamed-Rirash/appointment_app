"""
Item database models
"""

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Boolean, Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import metadata


class appointmentstatus(str, Enum):
    """Item status options"""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ItemCategory(str, Enum):
    """Item category options"""

    ELECTRONICS = "electronics"
    BOOKS = "books"
    CLOTHING = "clothing"
    HOME = "home"
    SPORTS = "sports"
    TOYS = "toys"
    OTHER = "other"


# appointments table
appointments = Table(
    "appointments",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("title", String(255), nullable=False, index=True),
    Column("description", Text, nullable=True),
    Column(
        "category", SQLEnum(ItemCategory), nullable=False, default=ItemCategory.OTHER
    ),
    Column(
        "status",
        SQLEnum(appointmentstatus),
        nullable=False,
        default=appointmentstatus.DRAFT,
    ),
    Column("price", Float, nullable=True),
    Column("quantity", Integer, nullable=False, default=0),
    Column("sku", String(100), nullable=True, unique=True, index=True),
    Column("tags", JSON, nullable=False, default=list),
    Column("metadata", JSON, nullable=False, default=dict),
    # Ownership and permissions
    Column(
        "owner_id",
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    ),
    Column("is_public", Boolean, nullable=False, default=False),
    Column("allow_comments", Boolean, nullable=False, default=True),
    # Timestamps
    Column(
        "created_at", DateTime, nullable=False, server_default=func.now(), index=True
    ),
    Column("updated_at", DateTime, nullable=True, onupdate=func.now()),
    Column("published_at", DateTime, nullable=True),
    Column("archived_at", DateTime, nullable=True),
    # Soft delete
    Column("deleted_at", DateTime, nullable=True),
    Column("deleted_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
)


# Item comments table (for demonstrating nested resource permissions)
item_comments = Table(
    "item_comments",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "item_id",
        UUID(as_uuid=True),
        ForeignKey("appointments.id"),
        nullable=False,
        index=True,
    ),
    Column(
        "author_id",
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    ),
    Column("content", Text, nullable=False),
    Column("is_approved", Boolean, nullable=False, default=True),
    Column(
        "parent_comment_id",
        UUID(as_uuid=True),
        ForeignKey("item_comments.id"),
        nullable=True,
    ),
    # Timestamps
    Column("created_at", DateTime, nullable=False, default=datetime.utcnow),
    Column("updated_at", DateTime, nullable=True, onupdate=datetime.utcnow),
    # Soft delete
    Column("deleted_at", DateTime, nullable=True),
    Column("deleted_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
)


# Item favorites table (for demonstrating user-specific permissions)
item_favorites = Table(
    "item_favorites",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "item_id",
        UUID(as_uuid=True),
        ForeignKey("appointments.id"),
        nullable=False,
        index=True,
    ),
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    ),
    Column("created_at", DateTime, nullable=False, default=datetime.utcnow),
    # Unique constraint to prevent duplicate favorites
    # Note: This would be defined in Alembic migration as:
    # sa.UniqueConstraint('item_id', 'user_id', name='uq_item_favorites_item_user')
)


# Item views table (for analytics and demonstrating read permissions)
item_views = Table(
    "item_views",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "item_id",
        UUID(as_uuid=True),
        ForeignKey("appointments.id"),
        nullable=False,
        index=True,
    ),
    Column(
        "viewer_id",
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    ),  # Nullable for anonymous views
    Column("ip_address", String(45), nullable=True),
    Column("user_agent", String(500), nullable=True),
    Column(
        "viewed_at", DateTime, nullable=False, server_default=func.now(), index=True
    ),
    Column("view_duration", Integer, nullable=True),  # Duration in seconds
    Column("metadata", JSON, nullable=False, default=dict),
)


# Item permissions table (for fine-grained access control)
item_permissions = Table(
    "item_permissions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "item_id",
        UUID(as_uuid=True),
        ForeignKey("appointments.id"),
        nullable=False,
        index=True,
    ),
    Column(
        "user_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    ),
    Column(
        "role_id", UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True, index=True
    ),
    # Permissions
    Column("can_read", Boolean, nullable=False, default=True),
    Column("can_update", Boolean, nullable=False, default=False),
    Column("can_delete", Boolean, nullable=False, default=False),
    Column("can_comment", Boolean, nullable=False, default=True),
    Column("can_share", Boolean, nullable=False, default=True),
    # Granted by and when
    Column("granted_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    Column("granted_at", DateTime, nullable=False, default=datetime.utcnow),
    Column("expires_at", DateTime, nullable=True),
    # Timestamps
    Column("created_at", DateTime, nullable=False, default=datetime.utcnow),
    Column("updated_at", DateTime, nullable=True, onupdate=datetime.utcnow),
    # Note: Either user_id or role_id should be set, not both
    # This would be enforced with a check constraint in Alembic migration
)
