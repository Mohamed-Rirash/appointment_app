import uuid

from sqlalchemy import (  # only so we can keep the original column order / labels
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
    literal_column,
    select,
    text,
)
from sqlalchemy_views import CreateView

from app.auth.models import users
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


office_member_details_def = select(
    users.c.id.label("user_id"),
    users.c.first_name,
    users.c.last_name,
    users.c.email,
    users.c.is_active.label("user_active"),
    office_memberships.c.id.label("membership_id"),
    office_memberships.c.office_id,
    office_memberships.c.position,
    office_memberships.c.is_primary,
    office_memberships.c.is_active.label("membership_active"),
    office_memberships.c.assigned_at,
    office_memberships.c.ended_at,
    offices.c.name.label("office_name"),
    offices.c.location.label("office_location"),
).select_from(
    office_memberships.join(users, users.c.id == office_memberships.c.user_id).join(
        offices, offices.c.id == office_memberships.c.office_id
    )
)
