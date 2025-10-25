from sqlalchemy import Boolean, Column, DateTime, Table, Text, Time
from sqlalchemy.dialects.postgresql import UUID

from app.database import metadata

# Define the appointment_details view with explicit columns matching the database view
appointment_details = Table(
    "appointment_details",
    metadata,
    # Host information
    Column("host_id", UUID(as_uuid=True)),
    Column("first_name", Text),  # Note: NOT host_firstname
    Column("last_name", Text),   # Note: NOT host_lastname
    Column("email", Text),       # Note: NOT host_email
    # Appointment information
    Column("appointment_id", UUID(as_uuid=True)),
    Column("purpose", Text),
    Column("appointment_date", DateTime(timezone=True)),
    Column("time_slotted", Time),
    Column("status", Text),
    Column("appointment_active", Boolean),
    Column("created_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True)),
    Column("canceled_at", DateTime(timezone=True)),
    Column("reason", Text),  # Note: NOT canceled_reason
    Column("issued_by", UUID(as_uuid=True)),
    Column("office_id", UUID(as_uuid=True)),
    # Citizen information
    Column("citizen_id", UUID(as_uuid=True)),
    Column("citizen_firstname", Text),
    Column("citizen_lastname", Text),
    Column("citizen_email", Text),
    Column("citizen_phone", Text),
)

