from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.appointments.constants import AppointmentStatus


# --- Citizen Input ---
class CitizenCreate(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    phone: str


# --- Appointment Input ---
class AppointmentCreate(BaseModel):
    host_id: UUID
    office_id: UUID
    purpose: str
    appointment_date: datetime
    time_slotted: time
    status: AppointmentStatus = AppointmentStatus.PENDING


# --- Combined Request ---
class AppointmentWithCitizenCreate(BaseModel):
    citizen: CitizenCreate
    appointment: AppointmentCreate


class CitizenRead(CitizenCreate):
    id: UUID


class AppointmentRead(AppointmentCreate):
    id: UUID
    citizen_id: UUID
    host_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    canceled_at: datetime | None = None
    canceled_by: UUID | None = None
    canceled_reason: str | None = None
    decision_reason: str | None = None
    decided_at: datetime | None = None
    decided_by: UUID | None = None
    new_appointment_date: datetime | None = None


class AppointmentWithCitizenRead(BaseModel):
    citizen: CitizenRead
    appointment: AppointmentRead


class Slot(BaseModel):
    id: UUID
    office_id: UUID
    slot_start: time
    slot_end: time
    date: date
    is_booked: bool


class AppointmentDecision(BaseModel):
    status: AppointmentStatus = Field(default=AppointmentStatus.APPROVED)
    reason: str | None = Field("", description="Reason for the decision")
    new_appointment_date: datetime | None = Field(
        None, description="New date for postponed appointments"
    )


class AppointmentCancel(BaseModel):
    reason: str = Field(..., description="Reason for cancellation")


class AppointmentUpdate(BaseModel):
    purpose: str | None = Field(None, description="Updated purpose of visit")
    appointment_date: datetime | None = Field(
        None, description="Updated appointment date"
    )
    time_slotted: time | None = Field(None, description="Updated time slot")


class AppointmentComplete(BaseModel):
    notes: str | None = Field(None, description="Optional notes for completion")


class AppointmentHistoryFilters(BaseModel):
    status: AppointmentStatus | None = Field(
        None, description="Filter by appointment status"
    )
    start_date: date | None = Field(None, description="Start date for history range")
    end_date: date | None = Field(None, description="End date for history range")
    citizen_id: UUID | None = Field(None, description="Filter by specific citizen")
    host_id: UUID | None = Field(None, description="Filter by specific host")


class AppointmentFilters(BaseModel):
    by_decision: AppointmentStatus | None = Field(
        None,
        description="Filter by appointment status (approved, denied, pending, etc.)",
    )
    by_time_slot: time | None = Field(None, description="Filter by appointment time")
    by_date: date | None = Field(None, description="Filter by appointment date")
    search: str | None = Field(
        None,
        description="Search by citizen name, email, or phone number",
    )
    completed: bool | None = Field(
        None, description="Filter only completed appointments"
    )
