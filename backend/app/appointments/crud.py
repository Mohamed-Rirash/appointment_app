from databases import Database
from sqlalchemy import and_, func, insert, or_, select, update

from app.appointments.models import appointments, citizen_info, time_slot
from app.appointments.view import appointment_details


class AppointmentCrud:
    @staticmethod
    async def create_citizen(db: Database, citizen_data: dict):
        query = insert(citizen_info).values(**citizen_data).returning(citizen_info)
        return await db.fetch_one(query)

    @staticmethod
    async def create_appointment(db: Database, appointment_data: dict):
        query = insert(appointments).values(**appointment_data).returning(appointments)
        return await db.fetch_one(query)

    @staticmethod
    async def get_available_slot(db: Database, date, slot_start, slot_end):
        query = select(time_slot).where(
            (time_slot.c.date == date)
            & (time_slot.c.slot_start == slot_start)
            & (time_slot.c.slot_end == slot_end)
            & (time_slot.c.is_booked.is_(False))
        )
        return await db.fetch_one(query)

    @staticmethod
    async def mark_slot_booked(db: Database, slot_id):
        query = (
            update(time_slot).where(time_slot.c.id == slot_id).values(is_booked=True)
        )
        await db.execute(query)

    @staticmethod
    async def update_appointment(db, appointment_id, appointment_data):
        query = (
            update(appointments)
            .where(appointments.c.id == appointment_id)
            .values(**appointment_data)
        )
        await db.execute(query)
        return await db.fetch_one(query)

    @staticmethod
    async def get_appointment_by_id(db, appointment_id):
        query = select(appointment_details).where(appointment_details.c.appointment_id == appointment_id)
        return await db.fetch_one(query)

    @staticmethod
    async def get_all_appointments(db, conditions=None):
        query = select(appointment_details)

        if conditions:
            query = query.where(and_(*conditions))

        # Always order by appointment_date and time
        query = query.order_by(
            appointment_details.c.appointment_date.asc(),
            appointment_details.c.time_slotted.asc(),
        )

        result = await db.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def get_appointment_me(db, user_id, when):
        query = (
            select(appointment_details)
            .where(appointment_details.c.issued_by == user_id)
            .where(func.date(appointment_details.c.appointment_date) == when)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
        )
        result = await db.fetch_all(query)
        return [dict(row) for row in result]
