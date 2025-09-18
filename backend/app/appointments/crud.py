import uuid

from databases import Database
from sqlalchemy import insert

from app.appointments.models import appointments, citizen_info
from app.auth.models import users
from app.office_mgnt.models import offices


class AppointmentCrud:
    @staticmethod
    async def create_citizen(db: Database, citizen_data: dict):
        query = insert(citizen_info).values(**citizen_data).returning(citizen_info)
        return await db.fetch_one(query)

    @staticmethod
    async def create_appointment(db: Database, appointment_data: dict):
        query = insert(appointments).values(**appointment_data).returning(appointments)
        return await db.fetch_one(query)
