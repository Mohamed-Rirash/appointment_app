# app/views/crud.py

from datetime import date
from uuid import UUID

from sqlalchemy import and_, func, or_, select

from app.appointments.view import appointment_details


class ViewAppointmentCrud:
    """Handles direct database queries to the appointment_details view."""

    @staticmethod
    def _base_query():
        """Base query on the view (SELECT * FROM appointment_details)."""
        return select(appointment_details)

    @staticmethod
    async def get_appointments_by_status(
        db,
        office_id: UUID,
        status: str,
        limit: int = 20,
        offset: int = 0,
    ):
        filters = and_(
            appointment_details.c.office_id == office_id,
            appointment_details.c.status == status.upper(),
        )

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total

    @staticmethod
    async def get_appointments_by_user_and_date(
        db,
        user_id: UUID,
        target_date: date,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ):
        base_filters = [
            appointment_details.c.issued_by == user_id,
            func.date(appointment_details.c.created_at) == target_date,
        ]
        if status:
            base_filters.append(appointment_details.c.status == status.upper())
        filters = and_(*base_filters)

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total

    @staticmethod
    async def search_appointments_in_office(
        db,
        office_id: UUID,
        query_term: str,
        limit: int = 20,
        offset: int = 0,
    ):
        filters = and_(
            appointment_details.c.office_id == office_id,
            or_(
                appointment_details.c.citizen_firstname.ilike(f"%{query_term}%"),
                appointment_details.c.citizen_lastname.ilike(f"%{query_term}%"),
                appointment_details.c.citizen_email.ilike(f"%{query_term}%"),
                appointment_details.c.purpose.ilike(f"%{query_term}%"),
            ),
        )

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total

    @staticmethod
    async def get_all_appointments_by_status(
        db,
        status: str,
        limit: int = 20,
        offset: int = 0,
    ):
        filters = and_(
            appointment_details.c.status == status.upper(),
        )

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total

    @staticmethod
    async def get_all_appointments_by_date_and_status(
        db,
        on_date: date,
        status: str | None,
        limit: int = 20,
        offset: int = 0,
    ):
        base_filters = [
            func.date(appointment_details.c.created_at) == on_date,
        ]
        if status:
            base_filters.append(appointment_details.c.status == status.upper())
        filters = and_(*base_filters)

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )
        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total

    @staticmethod
    async def get_all_past_appointments(
        db,
        status: str | None,
        office_id: UUID,
        date: date,
        limit: int = 20,
        offset: int = 0,
    ):
        filters = [
            appointment_details.c.office_id == office_id,
            appointment_details.c.appointment_date <= date,
        ]

        # Only filter status if provided
        if status:
            filters.append(appointment_details.c.status == status.upper())

        filters = and_(*filters)

        data_query = (
            ViewAppointmentCrud._base_query()
            .where(filters)
            .order_by(
                appointment_details.c.appointment_date.asc(),
                appointment_details.c.time_slotted.asc(),
            )
            .limit(limit)
            .offset(offset)
        )

        rows = await db.fetch_all(data_query)

        total_query = select(func.count()).select_from(
            ViewAppointmentCrud._base_query().where(filters).alias("subq")
        )
        total = await db.fetch_val(total_query)

        return [dict(row) for row in rows], total
