from datetime import date

from databases import Database
from sqlalchemy import func, select

from app.appointments.constants import AppointmentStatus
from app.appointments.models import appointments
from app.auth.models import users
from app.office_mgnt.models import offices
from app.status.schemas import AdminStats


class StatusService:
    @staticmethod
    async def get_admin_stats(db: Database) -> AdminStats:
        total_users_q = select(func.count()).select_from(users)
        total_active_offices_q = select(func.count()).select_from(offices).where(
            offices.c.is_active.is_(True)
        )

        today = date.today()
        todays_appointments_q = select(func.count()).select_from(appointments).where(
            func.date(appointments.c.appointment_date) == today
        )

        pending_appointments_q = (
            select(func.count())
            .select_from(appointments)
            .where(appointments.c.status == AppointmentStatus.PENDING)
        )

        approved_appointments_q = (
            select(func.count())
            .select_from(appointments)
            .where(appointments.c.status == AppointmentStatus.APPROVED)
        )

        cancelled_appointments_q = (
            select(func.count())
            .select_from(appointments)
            .where(appointments.c.status == AppointmentStatus.CANCELLED)
        )

        completed_appointments_q = (
            select(func.count())
            .select_from(appointments)
            .where(appointments.c.status == AppointmentStatus.COMPLETED)
        )

        total_users = (await db.fetch_one(total_users_q))[0]
        total_active_offices = (await db.fetch_one(total_active_offices_q))[0]
        total_todays_appointments = (await db.fetch_one(todays_appointments_q))[0]
        total_pending_appointments = (await db.fetch_one(pending_appointments_q))[0]
        total_approved_appointments = (await db.fetch_one(approved_appointments_q))[0]
        total_cancelled_appointments = (await db.fetch_one(cancelled_appointments_q))[0]
        total_completed_appointments = (await db.fetch_one(completed_appointments_q))[0]

        return AdminStats(
            total_users=total_users or 0,
            total_active_offices=total_active_offices or 0,
            total_todays_appointments=total_todays_appointments or 0,
            total_pending_appointments=total_pending_appointments or 0,
            total_approved_appointments=total_approved_appointments or 0,
            total_cancelled_appointments=total_cancelled_appointments or 0,
            total_completed_appointments=total_completed_appointments or 0,
        )

