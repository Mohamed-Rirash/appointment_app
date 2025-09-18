import uuid

from app.appointments import schemas as sch
from app.appointments.crud import AppointmentCrud


class AppointmentService:
    @staticmethod
    async def create_with_citizen(db, payload: sch.AppointmentWithCitizenCreate):
        async with db.transaction():
            # 1. Insert citizen
            citizen_data = payload.citizen.model_dump()
            citizen_data.setdefault("id", uuid.uuid4())
            citizen_record = await AppointmentCrud.create_citizen(db, citizen_data)
            # Ensure mapping to dict
            citizen_dict = dict(citizen_record) if citizen_record else None

            # 2. Insert appointment
            appointment_data = payload.appointment.model_dump()
            appointment_data["citizen_id"] = citizen_dict["id"]
            appointment_data.setdefault("id", uuid.uuid4())
            appointment_record = await AppointmentCrud.create_appointment(
                db, appointment_data
            )
            appointment_dict = dict(appointment_record) if appointment_record else None

        # Map to response schema
        return sch.AppointmentWithCitizenRead(
            citizen=sch.CitizenRead.model_validate(citizen_dict),
            appointment=sch.AppointmentRead.model_validate(appointment_dict),
        )
