import uuid
import logging
from datetime import date, datetime
from typing import Any, Dict, Union

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
from app.appointments.view import appointment_details
from app.core.serialization import serialize_database_record
from app.notifications.sse import SSEBroker, office_brokers

# Configure logging
logger = logging.getLogger(__name__)

# =============================================================================
# FIXED: Event Broadcasting Helper
# =============================================================================

async def broadcast_event(office_id: Union[uuid.UUID, str], event: Dict[str, Any]) -> None:
    """
    Publish event to the specific office's SSE broker.
    
    Args:
        office_id: Office UUID (can be string or UUID object)
        event: Dictionary containing:
            - "type": The event type (string)
            - Additional key-value pairs for the event payload
    
    Example:
        await broadcast_event(
            office_id="6e8be20d-22ce-4e8a-9c66-9e1b1876a3d7",
            event={
                "type": "new_appointment",
                "appointment": {...},
                "citizen": {...}
            }
        )
    """
    try:
        # Normalize office_id to UUID object
        if isinstance(office_id, str):
            office_id = uuid.UUID(office_id)
        
        # Get or create broker for this office
        broker = office_brokers.setdefault(office_id, SSEBroker())
        
        # Extract event type and create clean payload
        event_type = str(event["type"])
        event_data = {k: v for k, v in event.items() if k != "type"}
        
        # Publish to all subscribers
        await broker.publish(event_type, event_data)
        logger.info(f"📡 Broadcast event '{event_type}' to office {office_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to broadcast event: {e}")
        import traceback
        traceback.print_exc()


# =============================================================================
# FIXED: Appointment Service
# =============================================================================

class AppointmentService:
    @staticmethod
    async def create_with_citizen(
        db: Database,
        payload: sch.AppointmentWithCitizenCreate,
        user_id: uuid.UUID,
    ) -> sch.AppointmentWithCitizenRead:
        """
        Create an appointment with citizen and broadcast real-time events.
        """
        try:
            async with db.transaction():
                # 1️⃣ Create Citizen
                citizen_data = payload.citizen.model_dump()
                citizen_data.setdefault("id", uuid.uuid4())

                logger.info(f"Creating citizen: {citizen_data['id']}")
                citizen_record = await AppointmentCrud.create_citizen(db, citizen_data)
                if not citizen_record:
                    raise AppointmentNotFound("Failed to create citizen record.")

                citizen_dict = dict(citizen_record)
                logger.info(f"✅ Citizen created: {citizen_dict['id']}")

                # 2️⃣ Validate and book slot
                appointment_data = payload.appointment.model_dump()
                slot_date = appointment_data["appointment_date"].date()
                slot_time = appointment_data["time_slotted"]

                logger.info(f"Checking slot: {slot_date} at {slot_time}")
                slot = await AppointmentCrud.get_slot_by_start_time(
                    db, slot_date, slot_time
                )
                if not slot:
                    raise AppointmentNotFound(f"No slot found for {slot_time}.")

                if slot["is_booked"]:
                    raise AppointmentNotFound(f"Time slot {slot_time} is already booked.")

                logger.info(f"Marking slot {slot['id']} as booked")
                await AppointmentCrud.mark_slot_booked(db, slot["id"])

                # 3️⃣ Create Appointment
                appointment_data["citizen_id"] = citizen_dict["id"]
                appointment_data.setdefault("id", uuid.uuid4())
                appointment_data.setdefault("issued_by", user_id)
                appointment_data["decision_reason"] = None

                logger.info(f"Creating appointment: {appointment_data['id']}")
                appointment_record = await AppointmentCrud.create_appointment(
                    db, appointment_data
                )
                if not appointment_record:
                    raise AppointmentNotFound("Failed to create appointment record.")

                appointment_dict = dict(appointment_record)
                logger.info(f"✅ Appointment created: {appointment_dict['id']}")

        except Exception as e:
            logger.error(f"❌ Error in create_with_citizen: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise

        # 4️⃣ Broadcast events after successful commit
        if "office_id" in appointment_dict:
            office_id = str(appointment_dict["office_id"])

            # Serialize data
            citizen_dict_serializable = serialize_database_record(citizen_dict)
            appointment_dict_serializable = serialize_database_record(appointment_dict)

            # A. Notify new appointment
            await broadcast_event(
                office_id=office_id,
                event={
                    "type": "new_appointment",
                    "appointment": appointment_dict_serializable,
                    "citizen": citizen_dict_serializable,
                },
            )
            logger.info(f"📡 Sent new_appointment event for office {office_id}")

            # B. Notify updated time slots for that date
            from app.office_mgnt.crud import TimeSlotCRUD

            appointment_date = appointment_data["appointment_date"].date()
            updated_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment_dict["office_id"], appointment_date
            )

            updated_slots_serializable = [
                serialize_database_record(slot) for slot in updated_slots
            ]

            await broadcast_event(
                office_id=office_id,
                event={
                    "type": "time_slots_updated",
                    "date": str(appointment_date),
                    "slots": updated_slots_serializable,
                    "reason": "appointment_created",
                },
            )
            logger.info(f"📡 Sent time_slots_updated event for office {office_id}")

        # 5️⃣ Return response schema
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
        """Decide on a pending appointment (approve/deny)"""
        async with db.transaction():
            # 1. Fetch appointment
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # 2. Validate office_id matches
            if str(appointment.office_id) != str(office_id):
                raise AppointmentDecisionNotAllowed(
                    "Office ID does not match the appointment's office"
                )

            # 3. Validate status is pending
            if str(appointment.status) != AppointmentStatus.PENDING.value:
                raise AppointmentAlreadyApproved()

            # 4. Update appointment
            update_data = {
                "status": decision.status,
                "decided_at": datetime.now(),
                "decided_by": user_id,
                "decision_reason": decision.reason,
            }

            await AppointmentCrud.update_appointment(
                db, appointment_id, update_data
            )

            # 5. Broadcast event
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": f"appointment_{decision.status.value}",
                    "appointment_id": str(appointment_id),
                    "decision": decision.status.value,
                    "reason": decision.reason,
                },
            )
            logger.info(f"📡 Sent appointment_{decision.status.value} event")

            # Return updated appointment
            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def postpone_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        decision: sch.AppointmentDecision,
        user_id: uuid.UUID,
    ):
        """Postpone an appointment to a new date/time slot"""
        async with db.transaction():
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # Validate status
            if appointment.status not in [
                AppointmentStatus.PENDING,
                AppointmentStatus.APPROVED,
                AppointmentStatus.POSTPONED,
            ]:
                raise AppointmentPostponementNotAllowed()

            # Validate new date/time provided
            if not decision.new_appointment_date or not decision.new_time_slot:
                raise ValueError("Both new_appointment_date and new_time_slot are required")

            # Check and book new slot
            slot_date = decision.new_appointment_date.date()
            slot_time = decision.new_time_slot
            new_slot = await AppointmentCrud.get_slot_by_start_time(
                db, slot_date, slot_time
            )
            if not new_slot or new_slot["is_booked"]:
                raise AppointmentNotFound("New time slot is not available")

            await AppointmentCrud.mark_slot_booked(db, new_slot["id"])

            # Free old slot
            old_slot_date = appointment.appointment_date.date()
            old_slot_time = appointment.time_slotted
            old_slot = await AppointmentCrud.get_slot_by_start_time(
                db, old_slot_date, old_slot_time
            )
            if old_slot:
                await db.execute(
                    f"UPDATE time_slot SET is_booked = false WHERE id = '{old_slot['id']}'"
                )

            # Update appointment
            update_data = {
                "status": AppointmentStatus.APPROVED,
                "decision_reason": decision.reason,
                "decided_at": datetime.now(),
                "decided_by": user_id,
                "appointment_date": decision.new_appointment_date,
                "time_slotted": decision.new_time_slot,
            }
            await AppointmentCrud.update_appointment(db, appointment_id, update_data)

            # Get updated slots for both dates
            from app.office_mgnt.crud import TimeSlotCRUD

            old_date_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment.office_id, old_slot_date
            )
            new_date_slots = await TimeSlotCRUD.get_slots_by_date(
                db, appointment.office_id, slot_date
            )

            # Broadcast postponement event
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_postponed",
                    "appointment_id": str(appointment_id),
                    "old_date": appointment.appointment_date.isoformat(),
                    "old_time": str(appointment.time_slotted),
                    "new_date": decision.new_appointment_date.isoformat(),
                    "new_time": str(decision.new_time_slot),
                    "updated_slots": {
                        "old_date": {
                            "date": str(old_slot_date),
                            "slots": [serialize_database_record(s) for s in old_date_slots],
                        },
                        "new_date": {
                            "date": str(slot_date),
                            "slots": [serialize_database_record(s) for s in new_date_slots],
                        },
                    },
                },
            )
            logger.info(f"📡 Sent appointment_postponed event")

            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def edit_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        update_data: sch.AppointmentUpdate,
        user_id: uuid.UUID,
    ):
        """Edit appointment details (purpose, date, time)"""
        async with db.transaction():
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            # Build update dict
            update_dict = {}
            if update_data.purpose is not None:
                update_dict["purpose"] = update_data.purpose
            if update_data.appointment_date is not None:
                update_dict["appointment_date"] = update_data.appointment_date
            if update_data.time_slotted is not None:
                update_dict["time_slotted"] = update_data.time_slotted

            if not update_dict:
                return appointment  # Nothing to update

            # Validate status
            if appointment.status != AppointmentStatus.PENDING:
                if "appointment_date" in update_dict or "time_slotted" in update_dict:
                    raise AppointmentEditNotAllowed(
                        "Can only edit date/time for pending appointments"
                    )

            # Update
            await AppointmentCrud.update_appointment(db, appointment_id, update_dict)

            # Broadcast event
            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_updated",
                    "appointment_id": str(appointment_id),
                    "updates": serialize_database_record(update_dict),
                },
            )
            logger.info(f"📡 Sent appointment_updated event")

            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def cancel_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        cancel_data: sch.AppointmentCancel,
        user_id: uuid.UUID,
    ):
        """Cancel an appointment"""
        async with db.transaction():
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

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

            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_cancelled",
                    "appointment_id": str(appointment_id),
                    "reason": cancel_data.reason,
                },
            )
            logger.info(f"📡 Sent appointment_cancelled event")

            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def complete_appointment(
        db: Database,
        appointment_id: uuid.UUID,
        complete_data: sch.AppointmentComplete,
        user_id: uuid.UUID,
    ):
        """Mark appointment as completed"""
        async with db.transaction():
            appointment = await AppointmentCrud.get_appointment_by_id(
                db, appointment_id
            )
            if not appointment:
                raise AppointmentNotFound()

            if appointment.status != AppointmentStatus.APPROVED:
                raise AppointmentCompletionNotAllowed(
                    "Can only complete approved appointments"
                )

            await AppointmentCrud.update_appointment(
                db,
                appointment_id,
                {"status": AppointmentStatus.COMPLETED, "is_active": False},
            )

            await broadcast_event(
                office_id=str(appointment.office_id),
                event={
                    "type": "appointment_completed",
                    "appointment_id": str(appointment_id),
                    "notes": complete_data.notes if complete_data else None,
                },
            )
            logger.info(f"📡 Sent appointment_completed event")

            return await AppointmentCrud.get_appointment_by_id(db, appointment_id)

    @staticmethod
    async def search_approved_appointments(db: Database, search_term: str):
        """Search for approved appointments by citizen info"""
        conditions = [
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
        """Get historical appointments"""
        conditions = [appointment_details.c.appointment_active.is_(False)]

        if filters:
            if filters.status:
                conditions.append(appointment_details.c.status == filters.status)

            if filters.start_date:
                conditions.append(
                    func.date(appointment_details.c.appointment_date) >= filters.start_date
                )

            if filters.end_date:
                conditions.append(
                    func.date(appointment_details.c.appointment_date) <= filters.end_date
                )

            if filters.citizen_id:
                conditions.append(appointment_details.c.citizen_id == filters.citizen_id)

            if filters.host_id:
                conditions.append(appointment_details.c.host_id == filters.host_id)

        appointments = await AppointmentCrud.get_all_appointments(db, conditions)
        return appointments

    @staticmethod
    async def generate_appointment_slip(db: Database, appointment_id: uuid.UUID):
        """Generate appointment slip data"""
        appointment = await AppointmentCrud.get_appointment_by_id(db, appointment_id)
        if not appointment:
            raise AppointmentNotFound()

        slip_data = {
            "appointment_id": str(appointment.id),
            "citizen_name": f"{appointment.citizen_firstname} {appointment.citizen_lastname}",
            "citizen_phone": appointment.citizen_phone,
            "citizen_email": appointment.citizen_email,
            "host_name": appointment.host_name,
            "office_name": appointment.office_name,
            "purpose": appointment.purpose,
            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None,
            "time_slotted": str(appointment.time_slotted) if appointment.time_slotted else None,
            "status": appointment.status,
            "issued_by": appointment.issued_by_name,
            "issued_at": appointment.created_at.isoformat() if appointment.created_at else None,
        }

        return slip_data

    @staticmethod
    async def get_appointments(
        db: Database, filters: sch.AppointmentFilters | None = None
    ):
        """Get appointments with filters"""
        conditions = []

        if filters:
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

            if filters.by_decision is not None:
                conditions.append(appointment_details.c.status == filters.by_decision)

            if filters.by_date is not None:
                conditions.append(
                    func.date(appointment_details.c.appointment_date) == filters.by_date
                )

            if filters.by_time_slot is not None:
                conditions.append(appointment_details.c.time_slotted == filters.by_time_slot)

            if filters.completed is True:
                conditions.append(appointment_details.c.appointment_active.is_(False))
                conditions.append(appointment_details.c.status == AppointmentStatus.COMPLETED)

        appointments = await AppointmentCrud.get_all_appointments(db, conditions)

        if not appointments:
            raise AppointmentNotFound()

        return appointments

    @staticmethod
    async def get_my_appointments(db: Database, user_id: uuid.UUID, when: date):
        """Get appointments for a specific user"""
        return await AppointmentCrud.get_appointment_me(db, user_id, when)