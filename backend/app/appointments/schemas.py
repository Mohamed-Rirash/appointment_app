from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.appointments.utils import AppointmentStatus


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
