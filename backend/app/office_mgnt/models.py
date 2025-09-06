import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
    text,
)
from sqlalchemy_views import CreateView

from app.database import metadata

offices = Table(
    "offices",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("name", String(100), nullable=False, unique=True),
    Column("description", Text, nullable=True),
    Column("location", String, nullable=False),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
)

office_memberships = Table(
    "office_memberships",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    ),
    Column(
        "office_id",
        UUID(as_uuid=True),
        ForeignKey("offices.id"),
        nullable=False,
        index=True,
    ),
    Column("position", String(100), nullable=True),
    # Mark if this user is the primary contact/head of the office
    Column("is_primary", Boolean, nullable=False, server_default=text("false")),
    # Soft delete / active status
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    # Assignment timeline
    Column("assigned_at", DateTime(timezone=True), server_default=func.now()),
    Column("ended_at", DateTime(timezone=True), nullable=True),
    # Timestamps
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
    # Optional: Add if you want to track who made the assignment
    Column("assigned_by_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
)


office_member_details = Table("office_member_details", metadata)

# Define the SQL that powers the view
office_member_details_def = text(
    """
    SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active AS user_active,
        m.id AS membership_id,
        m.office_id,
        m.position,
        m.is_primary,
        m.is_active AS membership_active,
        m.assigned_at,
        m.ended_at,
        o.name AS office_name,
        o.location AS office_location
    FROM office_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN offices o ON o.id = m.office_id
"""
)
