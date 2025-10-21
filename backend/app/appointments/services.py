import uuid
from datetime import date, datetime

from databases import Database
from sqlalchemy import func, or_

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.crud import AppointmentCrud
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentCompletionNotAllowed,
    AppointmentDecisionNotAllowed,
    AppointmentEditNotAllowed,
    AppointmentNotFound,
    AppointmentPostponementNotAllowed,
)
from app.appointments.utils import broadcast_event
from app.appointments.view import appointment_details


class AppointmentService:
    @staticmethod
    async def create_with_citizen(
        db, payload: sch.AppointmentWithCitizenCreate, user_id
    ):
        async with db.transaction():
            # 1️⃣ Insert Citizen
            citizen_data = payload.citizen.model_dump()
            citizen_data.setdefault("id", uuid.uuid4())

            citizen_record = await AppointmentCrud.create_citizen(db, citizen_data)
            if not citizen_record:
                raise AppointmentNotFound("Failed to create citizen record.")

            citizen_dict = dict(citizen_record)

            # 2️⃣ Check available slot
            appointment_data = payload.appointment.model_dump()
            slot_date = appointment_data["appointment_date"].date()
            slot_time = appointment_data["time_slotted"]

            # Find slot by start time
            slot = await AppointmentCrud.get_slot_by_start_time(
                db, slot_date, slot_time
            )
            if not slot:
                raise AppointmentNotFound(f"No slot found for {slot_time}.")

            # Check if booked
            if slot["is_booked"]:
                raise AppointmentNotFound(f"Time slot {slot_time} is already booked.")

            # Mark slot booked
            await AppointmentCrud.mark_slot_booked(db, slot["id"])

            # 3️⃣ Insert Appointment
            appointment_data["citizen_id"] = citizen_dict["id"]

            # Set default values
            appointment_data.setdefault("id", uuid.uuid4())
            appointment_data.setdefault("issued_by", user_id)

            # Explicitly set decision_reason to None to ensure consistency
            appointment_data["decision_reason"] = None



            appointment_record = await AppointmentCrud.create_appointment(
                db, appointment_data
            )
            if not appointment_record:
                raise AppointmentNotFound("Failed to create appointment record.")

            appointment_dict = dict(appointment_record)

        # 4️⃣ Broadcast event after transaction commit
        if "office_id" in appointment_dict:
            await broadcast_event(
                office_id=appointment_dict["office_id"],
                event={
                    "type": "new_appointment",
                    "citizen": citizen_dict,
                    "appointment": appointment_dict,
                },
            )

        # 5️⃣ Return combined schema
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
    async def postpone_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        decision: sch.AppointmentDecision,
        user_id: uuid.UUID,
    ):
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Validate state - can only postpone pending appointments
            if appointment.status not in [AppointmentStatus.PENDING]:
                raise AppointmentPostponementNotAllowed()

            # 3. Update appointment with postpone decision
            update_data = {
                "status": AppointmentStatus.POSTPONED,
                "decision_reason": decision.reason,
                "decided_at": datetime.now(),
                "decided_by": user_id,
            }

            # If new date is provided, update it
            if decision.new_appointment_date:
                update_data["new_appointment_date"] = decision.new_appointment_date

            await AppointmentCrud.update_appointment(db, appointment_id, update_data)

            # 4. Broadcast event to notify about postponement
            await broadcast_event(
                office_id=appointment.office_id,
                event={
                    "type": "appointment_postponed",
                    "appointment_id": str(appointment_id),
                    "reason": decision.reason,
                    "new_date": (
                        decision.new_appointment_date.isoformat()
                        if decision.new_appointment_date
                        else None
                    ),
                },
            )

            # Return updated appointment
            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def edit_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        update_data: sch.AppointmentUpdate,
        user_id: uuid.UUID,
    ):
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Prepare update data
            update_dict = {}
            if update_data.purpose is not None:
                update_dict["purpose"] = update_data.purpose
            if update_data.appointment_date is not None:
                update_dict["appointment_date"] = update_data.appointment_date
            if update_data.time_slotted is not None:
                update_dict["time_slotted"] = update_data.time_slotted

            # 3. Only allow editing pending appointments
            if appointment.status != AppointmentStatus.PENDING:
                # For non-pending appointments, only allow purpose updates
                if "appointment_date" in update_dict or "time_slotted" in update_dict:
                    raise AppointmentEditNotAllowed(
                        "Can only edit date/time for pending appointments"
                    )

            # 4. Update appointment
            if update_dict:
                await AppointmentCrud.update_appointment(
                    db, appointment_id, update_dict
                )

            # 5. Broadcast event
            await broadcast_event(
                office_id=appointment.office_id,
                event={
                    "type": "appointment_updated",
                    "appointment_id": str(appointment_id),
                    "updates": update_dict,
                },
            )

            # Return updated appointment
            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def cancel_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        cancel_data: sch.AppointmentCancel,
        user_id: uuid.UUID,
    ):
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Update appointment with cancellation data
            await AppointmentCrud.update_appointment(
                db,
                appointment_id,
                {
                    "status": AppointmentStatus.CANCELLED,
                    "canceled_at": datetime.now(),
                    "canceled_by": user_id,
                    "canceled_reason": cancel_data.reason,
                    "is_active": False,
                },
            )

            # 3. Broadcast event
            await broadcast_event(
                office_id=appointment.office_id,
                event={
                    "type": "appointment_cancelled",
                    "appointment_id": str(appointment_id),
                    "reason": cancel_data.reason,
                },
            )

            # Return updated appointment
            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def complete_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        complete_data: sch.AppointmentComplete,
        user_id: uuid.UUID,
    ):
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Only allow completing approved appointments
            if appointment.status != AppointmentStatus.APPROVED:
                raise AppointmentCompletionNotAllowed(
                    "Can only complete approved appointments"
                )

            # 3. Update appointment to completed
            await AppointmentCrud.update_appointment(
                db,
                appointment_id,
                {"status": AppointmentStatus.COMPLETED, "is_active": False},
            )

            # 4. Broadcast event
            await broadcast_event(
                office_id=appointment.office_id,
                event={
                    "type": "appointment_completed",
                    "appointment_id": str(appointment_id),
                    "notes": complete_data.notes if complete_data else None,
                },
            )

            # Return updated appointment
            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def search_approved_appointments(db: Database, search_term: str):
        # Search for approved appointments by citizen info
        conditions = [
            appointment_details.c.status == AppointmentStatus.APPROVED,
            appointment_details.c.appointment_active.is_(True),
            or_(
                appointment_details.c.citizen_firstname.ilike(f"%{search_term}%"),
                appointment_details.c.citizen_lastname.ilike(f"%{search_term}%"),
                appointment_details.c.citizen_phone.ilike(f"%{search_term}%"),
                appointment_details.c.citizen_email.ilike(f"%{search_term}%"),
            ),
        ]

        appointments = await AppointmentCrud.get_all_appointments(db, conditions)
        return appointments

    @staticmethod
    async def get_appointment_history(
        db: Database, filters: sch.AppointmentHistoryFilters
    ):
        conditions = []

        # Only include non-active appointments (completed, cancelled, etc.)
        conditions.append(appointment_details.c.appointment_active.is_(False))

        if filters:
            if filters.status:
                conditions.append(appointment_details.c.status == filters.status)

            if filters.start_date:
                conditions.append(
                    func.date(appointment_details.c.appointment_date)
                    >= filters.start_date
                )

            if filters.end_date:
                conditions.append(
                    func.date(appointment_details.c.appointment_date)
                    <= filters.end_date
                )

            if filters.citizen_id:
                conditions.append(
                    appointment_details.c.citizen_id == filters.citizen_id
                )

            if filters.host_id:
                conditions.append(appointment_details.c.host_id == filters.host_id)

        appointments = await AppointmentCrud.get_all_appointments(db, conditions)
        return appointments

    @staticmethod
    async def generate_appointment_slip(db: Database, appointment_id: uuid.UUID):
        # Get appointment with full details for printing
        appointment = await AppointmentCrud.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise AppointmentNotFound()

        # Generate slip data (this could be enhanced to return HTML/PDF data)
        slip_data = {
            "appointment_id": str(appointment.id),
            "citizen_name": f"{appointment.citizen_firstname} {appointment.citizen_lastname}",
            "citizen_phone": appointment.citizen_phone,
            "citizen_email": appointment.citizen_email,
            "host_name": appointment.host_name,
            "office_name": appointment.office_name,
            "purpose": appointment.purpose,
            "appointment_date": (
                appointment.appointment_date.isoformat()
                if appointment.appointment_date
                else None
            ),
            "time_slotted": (
                str(appointment.time_slotted) if appointment.time_slotted else None
            ),
            "status": appointment.status,
            "issued_by": appointment.issued_by_name,
            "issued_at": (
                appointment.created_at.isoformat() if appointment.created_at else None
            ),
        }

        return slip_data

    @staticmethod
    async def get_appointments(
        db: Database, filters: sch.AppointmentFilters | None = None
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
