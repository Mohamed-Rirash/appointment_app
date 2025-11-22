from datetime import date

from databases import Database
from sqlalchemy import func, select

from app.appointments.models import appointments
from app.auth.models import users
from app.office_mgnt.models import office_memberships, offices


async def count_total_users(db: Database) -> int:
    query = select(func.count()).select_from(users)
    return (await db.fetch_one(query))[0]


async def count_total_members(db: Database) -> int:
    query = (
        select(func.count())
        .select_from(office_memberships)
        .where(office_memberships.c.is_active.is_(True))
    )
    return (await db.fetch_one(query))[0]


async def count_total_offices(db: Database) -> int:
    query = select(func.count()).select_from(offices)
    return (await db.fetch_one(query))[0]


async def count_total_active_offices(db: Database) -> int:
    query = (
        select(func.count())
        .select_from(offices)
        .where(offices.c.is_active.is_(True))
    )
    return (await db.fetch_one(query))[0]


async def count_appointments_on_date(db: Database, target_date: date) -> int:
    query = (
        select(func.count())
        .select_from(appointments)
        .where(appointments.c.appointment_date == target_date)
    )
    return (await db.fetch_one(query))[0]


async def count_appointments_by_status(db: Database, status_value) -> int:
    query = (
        select(func.count())
        .select_from(appointments)
        .where(appointments.c.status == status_value)
    )
    return (await db.fetch_one(query))[0]
