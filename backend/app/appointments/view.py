# view.py

from sqlalchemy import Boolean, Column, DateTime, String, Table, select
from sqlalchemy.dialects.postgresql import UUID

from app.appointments.models import appointments, citizen_info
from app.auth.models import users
from app.database import metadata

# 1. Explicit Table for querying
appointment_details = Table(
    "appointment_details",
    metadata,
    Column("host_id", UUID(as_uuid=True)),
    Column("host_first_name", String),
    Column("host_last_name", String),
    Column("host_email", String),
    Column("appointment_id", UUID(as_uuid=True)),
    Column("citizen_id", UUID(as_uuid=True)),
    Column("office_id", UUID(as_uuid=True)),
    Column("purpose", String),
    Column("appointment_date", DateTime(timezone=True)),
    Column("time_slotted", String),
    Column("status", String),
    Column("appointment_active", Boolean),
    Column("created_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True)),
    Column("canceled_at", DateTime(timezone=True), nullable=True),
    Column("canceled_by", UUID(as_uuid=True), nullable=True),
    Column("canceled_reason", String, nullable=True),
    Column("issued_by", UUID(as_uuid=True)),
    Column("decision_reason", String, nullable=True),
    Column("decided_at", DateTime(timezone=True), nullable=True),
    Column("decided_by", UUID(as_uuid=True), nullable=True),
    Column("new_appointment_date", DateTime(timezone=True), nullable=True),
    Column("citizen_firstname", String),
    Column("citizen_lastname", String),
    Column("citizen_email", String),
    Column("citizen_phone", String),
)

# 2. View definition for DDL (used in Alembic)
appointment_details_def = select(
    users.c.id.label("host_id"),
    users.c.first_name.label("host_first_name"),
    users.c.last_name.label("host_last_name"),
    users.c.email.label("host_email"),
    appointments.c.id.label("appointment_id"),
    appointments.c.citizen_id,
    appointments.c.office_id,
    appointments.c.purpose,
    appointments.c.appointment_date,
    appointments.c.time_slotted,
    appointments.c.status,
    appointments.c.is_active.label("appointment_active"),
    appointments.c.created_at,
    appointments.c.updated_at,
    appointments.c.canceled_at,
    appointments.c.canceled_by,
    appointments.c.canceled_reason,
    appointments.c.issued_by,
    appointments.c.decision_reason,
    appointments.c.decided_at,
    appointments.c.decided_by,
    appointments.c.new_appointment_date,
    citizen_info.c.firstname.label("citizen_firstname"),
    citizen_info.c.lastname.label("citizen_lastname"),
    citizen_info.c.email.label("citizen_email"),
    citizen_info.c.phone.label("citizen_phone"),
).select_from(
    appointments.join(users, users.c.id == appointments.c.host_id).join(
        citizen_info, citizen_info.c.id == appointments.c.citizen_id
    )
)
