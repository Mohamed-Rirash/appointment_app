# app/views/services.py

from datetime import date
from uuid import UUID

from databases import Database

from app.views.crud import ViewAppointmentCrud
from app.views.schemas import AppointmentDetails, PaginatedAppointments


class ViewAppointmentService:
    """
    Service layer: fetch, map, and return appointment records from the view table
    using Pydantic models for a clean API response.
    """

    @staticmethod
    def _map_row_to_model(row: dict) -> AppointmentDetails:
        """
        Convert a raw row (dict) from DB into AppointmentDetails Pydantic model.
        Only one schema model is used for all statuses.
        """
        return AppointmentDetails.model_validate(row)

    @staticmethod
    async def get_appointments_by_status(
        office_id: UUID,
        status: str,
        db: Database,
        limit: int = 20,
        offset: int = 0,
    ) -> PaginatedAppointments:
        rows, total = await ViewAppointmentCrud.get_appointments_by_status(
            db, office_id, status, limit, offset
        )
        appointments: list[AppointmentDetails] = [
            ViewAppointmentService._map_row_to_model(row) for row in rows
        ]
        return PaginatedAppointments(
            total=total, limit=limit, offset=offset, appointments=appointments
        )

    @staticmethod
    async def get_user_appointments_on_date(
        user_id: UUID,
        target_date: date,
        db: Database,
        limit: int = 20,
        offset: int = 0,
    ) -> PaginatedAppointments:
        rows, total = await ViewAppointmentCrud.get_appointments_by_user_and_date(
            db, user_id, target_date, limit, offset
        )
        appointments: list[AppointmentDetails] = [
            ViewAppointmentService._map_row_to_model(row) for row in rows
        ]
        return PaginatedAppointments(
            total=total, limit=limit, offset=offset, appointments=appointments
        )

    @staticmethod
    async def search_office_appointments(
        office_id: UUID,
        query_term: str,
        db: Database,
        limit: int = 20,
        offset: int = 0,
    ) -> PaginatedAppointments:
        rows, total = await ViewAppointmentCrud.search_appointments_in_office(
            db, office_id, query_term, limit, offset
        )
        appointments: list[AppointmentDetails] = [
            ViewAppointmentService._map_row_to_model(row) for row in rows
        ]
        return PaginatedAppointments(
            total=total, limit=limit, offset=offset, appointments=appointments
        )
