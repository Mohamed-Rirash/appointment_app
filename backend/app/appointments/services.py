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
from app.core.serialization import serialize_database_record


class AppointmentService:
    @staticmethod
    async def create_with_citizen(
        db, payload: sch.AppointmentWithCitizenCreate, user_id
    ):
        try:
            async with db.transaction():
                # 1️⃣ Insert Citizen
                citizen_data = payload.citizen.model_dump()
                citizen_data.setdefault("id", uuid.uuid4())

                print(f"Creating citizen with data: {citizen_data}")
                citizen_record = await AppointmentCrud.create_citizen(db, citizen_data)
                if not citizen_record:
                    raise AppointmentNotFound("Failed to create citizen record.")

                citizen_dict = dict(citizen_record)
                print(f"Citizen created: {citizen_dict['id']}")

                # 2️⃣ Check available slot
                appointment_data = payload.appointment.model_dump()
                slot_date = appointment_data["appointment_date"].date()
                slot_time = appointment_data["time_slotted"]

                print(f"Checking slot for date: {slot_date}, time: {slot_time}")
                # Find slot by start time
                slot = await AppointmentCrud.get_slot_by_start_time(
                    db, slot_date, slot_time
                )
                if not slot:
                    raise AppointmentNotFound(f"No slot found for {slot_time}.")

                # Check if booked
                if slot["is_booked"]:
                    raise AppointmentNotFound(
                        f"Time slot {slot_time} is already booked."
                    )

                print(f"Marking slot {slot['id']} as booked")
                # Mark slot booked
                await AppointmentCrud.mark_slot_booked(db, slot["id"])

                # 3️⃣ Insert Appointment
                appointment_data["citizen_id"] = citizen_dict["id"]

                # Set default values
                appointment_data.setdefault("id", uuid.uuid4())
                appointment_data.setdefault("issued_by", user_id)

                # Explicitly set decision_reason to None to ensure consistency
                appointment_data["decision_reason"] = None

                print(f"Creating appointment with data: {appointment_data}")
                appointment_record = await AppointmentCrud.create_appointment(
                    db, appointment_data
                )
                if not appointment_record:
                    raise AppointmentNotFound("Failed to create appointment record.")

                appointment_dict = dict(appointment_record)
                print(f"Appointment created: {appointment_dict['id']}")
        except Exception as e:
            print(f"Error in create_with_citizen service: {type(e).__name__}: {e!s}")
            import traceback

            traceback.print_exc()
            raise

        # 4️⃣ Broadcast event after transaction commit
        if "office_id" in appointment_dict:
            # Convert database records to JSON-serializable format
            citizen_dict_serializable = serialize_database_record(citizen_dict)
            appointment_dict_serializable = serialize_database_record(appointment_dict)

            await broadcast_event(
                office_id=str(appointment_dict["office_id"]),
                event={
                    "type": "new_appointment",
                    "citizen": citizen_dict_serializable,
                    "appointment": appointment_dict_serializable,
                },
            )

            # 5️⃣ Broadcast updated time slots for the appointment date
            from app.office_mgnt.crud import TimeSlotCRUD

            appointment_date = appointment_data["appointment_date"].date()
            updated_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment_dict["office_id"], appointment_date
            )
            updated_slots_serializable = [
                serialize_database_record(slot) for slot in updated_slots
            ]

            await broadcast_event(
                office_id=str(appointment_dict["office_id"]),
                event={
                    "type": "time_slots_updated",
                    "date": str(appointment_date),
                    "slots": updated_slots_serializable,
                    "reason": "appointment_created",
                },
            )

        # 6️⃣ Return combined schema
        return sch.AppointmentWithCitizenRead(
            citizen=sch.CitizenRead.model_validate(citizen_dict),
            appointment=sch.AppointmentRead.model_validate(appointment_dict),
        )

    @staticmethod
    async def decide_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        decision: sch.AppointmentDecision,
        user_id: uuid.UUID,
        office_id: uuid.UUID,
    ):
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Validate office_id matches the appointment's office
            if str(appointment.office_id) != str(office_id):
                raise AppointmentDecisionNotAllowed(
                    "Office ID does not match the appointment's office"
                )

            # 3. Validate state - can only decide on pending appointments
            # Convert status to string for comparison (in case it's returned as enum or string from DB)
            status_value = (
                str(appointment.status).lower() if appointment.status else None
            )
            if status_value != AppointmentStatus.PENDING.value:
                raise AppointmentAlreadyApproved()

            # 4. Prepare update data
            update_data = {
                "status": decision.status,
                "decided_at": datetime.now(),
                "decided_by": user_id,
            }

            # Add decision reason if provided
            if decision.reason:
                update_data["decision_reason"] = decision.reason

            # 5. Apply business logic
            if (
                decision.status == AppointmentStatus.APPROVED
                or decision.status == AppointmentStatus.DENIED
            ):
                await AppointmentCrud.update_appointment(
                    db, appointment_id, update_data
                )
            else:
                raise AppointmentDecisionNotAllowed(
                    "Decision must be approved or denied"
                )

            # 6. Broadcast event to notify about decision
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": f"appointment_{decision.status.value}",
                    "appointment_id": str(appointment_id),
                    "decision": decision.status.value,
                    "reason": decision.reason,
                },
            )

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

            # 2. Validate state - can only postpone pending, approved, or postponed appointments
            if appointment.status not in [
                AppointmentStatus.PENDING,
                AppointmentStatus.APPROVED,
                AppointmentStatus.POSTPONED,
            ]:
                raise AppointmentPostponementNotAllowed()

            # 3. Validate new date and time slot are provided
            if not decision.new_appointment_date or not decision.new_time_slot:
                raise ValueError(
                    "Both new_appointment_date and new_time_slot are required for postponing"
                )

            # 4. Check if new time slot is available
            slot_date = decision.new_appointment_date.date()
            slot_time = decision.new_time_slot

            print(f"Checking new slot for date: {slot_date}, time: {slot_time}")
            new_slot = await AppointmentCrud.get_slot_by_start_time(
                db, slot_date, slot_time
            )
            if not new_slot:
                raise AppointmentNotFound(
                    f"No slot found for {slot_time} on {slot_date}."
                )

            # Check if new slot is already booked
            if new_slot["is_booked"]:
                raise AppointmentNotFound(
                    f"Time slot {slot_time} on {slot_date} is already booked."
                )

            # 5. Free up the old time slot
            old_slot_date = appointment.appointment_date.date()
            old_slot_time = appointment.time_slotted
            old_slot = await AppointmentCrud.get_slot_by_start_time(
                db, old_slot_date, old_slot_time
            )
            if old_slot:
                # Mark old slot as available
                await db.execute(
                    f"UPDATE time_slot SET is_booked = false WHERE id = '{old_slot['id']}'"
                )
                print(f"Freed up old slot {old_slot['id']}")

            # 6. Book the new time slot
            await AppointmentCrud.mark_slot_booked(db, new_slot["id"])
            print(f"Booked new slot {new_slot['id']}")

            # 7. Update appointment with postpone decision and new date/time
            # Mark as APPROVED after postponing with new date/time
            # Store OLD date in new_appointment_date field for reference in notifications
            update_data = {
                "status": AppointmentStatus.APPROVED,
                "decision_reason": decision.reason,
                "decided_at": datetime.now(),
                "decided_by": user_id,
                "new_appointment_date": appointment.appointment_date,  # Store OLD date for reference
                "appointment_date": decision.new_appointment_date,  # Update to NEW date
                "time_slotted": decision.new_time_slot,  # Update to NEW time slot
            }

            await AppointmentCrud.update_appointment(db, appointment_id, update_data)

            # 8. Fetch updated time slots for both old and new dates
            from app.core.serialization import serialize_database_record
            from app.office_mgnt.crud import TimeSlotCRUD

            # Get updated slots for old date (now has freed slot)
            old_date_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment.office_id, old_slot_date
            )
            old_date_slots_serializable = [
                serialize_database_record(slot) for slot in old_date_slots
            ]

            # Get updated slots for new date (now has booked slot)
            new_date_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment.office_id, slot_date
            )
            new_date_slots_serializable = [
                serialize_database_record(slot) for slot in new_date_slots
            ]

            # 9. Broadcast event to notify about postponement with updated slots
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_postponed",
                    "appointment_id": str(appointment_id),
                    "reason": decision.reason,
                    "old_date": appointment.appointment_date.isoformat(),
                    "old_time": str(appointment.time_slotted),
                    "new_date": decision.new_appointment_date.isoformat(),
                    "new_time": str(decision.new_time_slot),
                    # Include updated time slots for both dates
                    "updated_slots": {
                        "old_date": {
                            "date": str(old_slot_date),
                            "slots": old_date_slots_serializable,
                        },
                        "new_date": {
                            "date": str(slot_date),
                            "slots": new_date_slots_serializable,
                        },
                    },
                },
            )

            # 10. Broadcast separate time slot update events for frontend to refresh slots
            # This allows the frontend to update the time slot picker without full page reload
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "time_slots_updated",
                    "date": str(old_slot_date),
                    "slots": old_date_slots_serializable,
                    "reason": "appointment_postponed",
                },
            )

            # Only broadcast for new date if it's different from old date
            if str(slot_date) != str(old_slot_date):
                await broadcast_event(
                    office_id=str(appointment.office_id),
                    event={
                        "type": "time_slots_updated",
                        "date": str(slot_date),
                        "slots": new_date_slots_serializable,
                        "reason": "appointment_postponed",
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

            # If there's nothing to update, return the existing appointment
            # and avoid broadcasting a no-op update event.
            if not update_dict:
                return appointment

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
            from app.core.serialization import convert_to_json_serializable

            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_updated",
                    "appointment_id": str(appointment_id),
                    "updates": convert_to_json_serializable(update_dict),
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
                office_id=str(appointment.office_id),
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
                office_id=str(appointment.office_id),
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
            # appointment_details.c.status == AppointmentStatus.APPROVED,
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
