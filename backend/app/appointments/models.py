import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    Date,
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

from app.appointments.constants import AppointmentStatus
from app.database import metadata

# --- Citizens Table ---
citizen_info = Table(
    "citizen_info",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("firstname", String(100), nullable=False),
    Column("lastname", String(100), nullable=False),
    Column("email", String(100), nullable=False),
    Column("phone", String(20), unique=True, nullable=False),
)


# --- Appointments Table ---
appointments = Table(
    "appointments",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    # Who booked
    Column(
        "citizen_id", UUID(as_uuid=True), ForeignKey("citizen_info.id"), nullable=False
    ),
    # Who is hosting (a user/secretary/employee)
    Column("host_id", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False),
    # Which office
    Column("office_id", UUID(as_uuid=True), ForeignKey("offices.id"), nullable=False),
    # Purpose of visit
    Column("purpose", Text, nullable=False),
    # Appointment date and time
    Column("appointment_date", DateTime(timezone=True), nullable=False),
    Column("time_slotted", Time, nullable=False),
    # Status
    Column(
        "status", Enum(AppointmentStatus), nullable=False, server_default="scheduled"
    ),
    # Metadata
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    Column(
        "updated_at",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    ),
    # Cancellation tracking
    Column("canceled_at", DateTime(timezone=True), nullable=True),
    Column("canceled_by", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True),
)


time_slot = Table(
    "time_slots",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("office_id", UUID(as_uuid=True), nullable=False),
    Column("slot_start", Time, nullable=False),
    Column("slot_end", Time, nullable=False),
    Column("date", Date, nullable=False),
    Column("is_booked", Boolean, nullable=False, server_default=text("true")),
)
