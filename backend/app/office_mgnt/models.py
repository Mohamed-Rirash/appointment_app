import uuid

from sqlalchemy import (  # only so we can keep the original column order / labels
    UUID,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Table,
    Text,
    Time,
    func,
    text,
)

from app.database import metadata
from app.office_mgnt.utils import Daysofweek

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
        unique=True,
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

# TODO:
# -[x] Host → defines recurring availability (saved in DB).
#
# -[] Client → requests available slots for given date → backend: fetch host availability → generate slots → filter booked → return.
#
# -[] Client picks slot → create appointment record.

host_availability = Table(
    "host_availability",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "office_id", UUID(as_uuid=True), ForeignKey("offices.id"), nullable=False
    ),  # who is this belonging to?
    Column(
        "daysofweek",
        Enum(Daysofweek, name="dayofweek"),
        nullable=False,
    ),
    Column("start_time", Time, nullable=False),  # in hours
    Column("end_time", Time, nullable=False),  # in hours
    Column("is_recurring", Boolean, nullable=False, server_default=text("false")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
