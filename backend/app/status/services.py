from datetime import date

from databases import Database

from app.appointments.constants import AppointmentStatus
from app.status import crud
from app.status.schemas import AdminStats


class StatusService:
    @staticmethod
    async def get_admin_stats(db: Database) -> AdminStats:
        today = date.today()

        # Delegated DB queries
        total_users = await crud.count_total_users(db)
        total_members = await crud.count_total_members(db)
        total_offices = await crud.count_total_offices(db)
        total_active_offices = await crud.count_total_active_offices(db)
        total_todays_appointments = await crud.count_appointments_on_date(db, today)
        total_pending_appointments = await crud.count_appointments_by_status(
            db, AppointmentStatus.PENDING
        )
        total_approved_appointments = await crud.count_appointments_by_status(
            db, AppointmentStatus.APPROVED
        )
        total_denied_appointments = await crud.count_appointments_by_status(
            db, AppointmentStatus.DENIED
        )
        total_cancelled_appointments = await crud.count_appointments_by_status(
            db, AppointmentStatus.CANCELLED
        )
        total_completed_appointments = await crud.count_appointments_by_status(
            db, AppointmentStatus.COMPLETED
        )

        return AdminStats(
            total_users=total_users or 0,
            total_members=total_members or 0,
            total_offices=total_offices or 0,
            total_active_offices=total_active_offices or 0,
            total_todays_appointments=total_todays_appointments or 0,
            total_pending_appointments=total_pending_appointments or 0,
            total_approved_appointments=total_approved_appointments or 0,
            total_denied_appointments=total_denied_appointments or 0,
            total_cancelled_appointments=total_cancelled_appointments or 0,
            total_completed_appointments=total_completed_appointments or 0,
        )
