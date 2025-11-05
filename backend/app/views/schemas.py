# app/views/schemas.py

from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.appointments.constants import AppointmentStatus


class AppointmentDetails(BaseModel):
    # Host fields (from view)
    host_id: UUID
    host_first_name: str | None = None
    host_last_name: str | None = None
    host_email: EmailStr | None = None

    # Citizen fields (from view)
    citizen_id: UUID
    citizen_firstname: str | None = None
    citizen_lastname: str | None = None
    citizen_email: EmailStr | None = None
    citizen_phone: str | None = None

    # Appointment fields (from view)
    appointment_id: UUID
    office_id: UUID | None = None
    purpose: str | None = None
    appointment_date: datetime | None = None
    time_slotted: time | None = None  # Keep as str (DB returns string)
    status: AppointmentStatus
    appointment_active: bool
    created_at: datetime
    updated_at: datetime

    # Cancellation
    canceled_at: datetime | None = None
    canceled_by: UUID | None = None
    canceled_reason: str | None = None

    # Decision & issuance
    issued_by: UUID | None = None
    decision_reason: str | None = None
    decided_at: datetime | None = None
    decided_by: UUID | None = None
    new_appointment_date: datetime | None = None

    model_config = {"from_attributes": True}


class PaginatedAppointments(BaseModel):
    total: int
    limit: int
    offset: int
    appointments: list[AppointmentDetails]
