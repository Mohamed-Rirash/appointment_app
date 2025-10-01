from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, FutureDate

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


class AppointmentFilters(BaseModel):
    by_decision: Optional[AppointmentStatus] = Field(
        None,
        description="Filter by appointment status (approved, denied, pending, etc.)",
    )
    by_time_slot: Optional[time] = Field(None, description="Filter by appointment time")
    by_date: Optional[date] = Field(None, description="Filter by appointment date")
    search: Optional[str] = Field(
        None,
        description="Search by citizen name, email, or phone number",
    )
    completed: Optional[bool] = Field(
        None, description="Filter only completed appointments"
    )
