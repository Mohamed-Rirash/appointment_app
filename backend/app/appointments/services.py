import uuid
from datetime import date
from typing import Optional

from databases import Database
from sqlalchemy import func, or_

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.crud import AppointmentCrud
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentDecisionNotAllowed,
    AppointmentNotFound,
)
from app.appointments.models import appointments, citizen_info
from app.appointments.utils import broadcast_event
from app.appointments.view import appointment_details


class AppointmentService:
    @staticmethod
    async def create_with_citizen(
        db, payload: sch.AppointmentWithCitizenCreate, user_id
    ):
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
            appointment_data.setdefault("issued_by", user_id)
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
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
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

    @staticmethod
    async def get_appointments(
        db: Database, filters: Optional[sch.AppointmentFilters] = None
    ):
        conditions = []

        if filters:
            # 🔍 search by citizen info
            if filters.search:
                search_term = f"%{filters.search}%"
                conditions.append(
                    or_(
                        appointment_details.c.citizen_firstname.ilike(search_term),
                        appointment_details.c.citizen_lastname.ilike(search_term),
                        appointment_details.c.citizen_phone.ilike(search_term),
                        appointment_details.c.citizen_email.ilike(search_term),
                    )
                )

            # 🏷️ filter by decision/status
            if filters.by_decision is not None:
                conditions.append(appointment_details.c.status == filters.by_decision)

            # 📅 filter by date
            if filters.by_date is not None:
                conditions.append(
                    func.date(appointment_details.c.appointment_date) == filters.by_date
                )

            # ⏰ filter by time slot
            if filters.by_time_slot is not None:
                conditions.append(
                    appointment_details.c.time_slotted == filters.by_time_slot
                )

            # ✅ completed appointments (assume: completed = not active + status approved/denied)
            if filters.completed is True:
                conditions.append(appointment_details.c.appointment_active.is_(False))
                conditions.append(
                    appointment_details.c.status == AppointmentStatus.COMPLETED
                )

        appointments = await AppointmentCrud.get_all_appointments(db, conditions)

        if not appointments:
            raise AppointmentNotFound()

        return appointments

    @staticmethod
    async def get_my_appointments(db: Database, user_id: uuid.UUID, when: date):
        return await AppointmentCrud.get_appointment_me(db, user_id, when)
