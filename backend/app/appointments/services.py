import uuid

from databases import Database
from fastapi import HTTPException, status
from sqlalchemy import Transaction

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.crud import AppointmentCrud
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentDecisionNotAllowed,
    AppointmentNotFound,
)
from app.appointments.utils import broadcast_event


class AppointmentService:
    @staticmethod
    async def create_with_citizen(db, payload: sch.AppointmentWithCitizenCreate):
        async with db.transaction():
            # 1. Insert citizen
            citizen_data = payload.citizen.model_dump()
            citizen_data.setdefault("id", uuid.uuid4())
            citizen_record = await AppointmentCrud.create_citizen(db, citizen_data)
            citizen_dict = dict(citizen_record) if citizen_record else None

            # 2. Insert appointment
            appointment_data = payload.appointment.model_dump()
            appointment_data["citizen_id"] = citizen_dict["id"]
            appointment_data.setdefault("id", uuid.uuid4())
            appointment_record = await AppointmentCrud.create_appointment(
                db, appointment_data
            )
            appointment_dict = dict(appointment_record) if appointment_record else None

        # 🔔 3. Broadcast event (notify office)
        if appointment_dict and "office_id" in appointment_dict:
            await broadcast_event(
                office_id=appointment_dict["office_id"],
                event={
                    "type": "new_appointment",
                    "citizen": citizen_dict,
                    "appointment": appointment_dict,
                },
            )

        # 4. Return schema
        return sch.AppointmentWithCitizenRead(
            citizen=sch.CitizenRead.model_validate(citizen_dict),
            appointment=sch.AppointmentRead.model_validate(appointment_dict),
        )


@staticmethod
async def decide_appointment(
    db: Database, appointment_id: uuid.UUID, decision: AppointmentStatus
):
    async with db.transaction():
        # 1. Fetch appointment
        appointment = await AppointmentCrud.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise AppointmentNotFound()

        # 2. Validate state
        if appointment.status == AppointmentStatus.APPROVED:
            raise AppointmentAlreadyApproved()

        # 3. Apply business logic
        if decision == AppointmentStatus.APPROVED:
            await AppointmentCrud.update_appointment(
                db, appointment_id, {"status": decision}
            )
            await AppointmentCrud.mark_slot_booked(db, appointment.slot_id)
        elif decision == AppointmentStatus.DENIED:
            await AppointmentCrud.update_appointment(
                db, appointment_id, {"status": decision}
            )
        else:
            raise AppointmentDecisionNotAllowed()

        # Return updated appointment
        return await AppointmentCrud.get_appointment_by_id(db, appointment_id)
