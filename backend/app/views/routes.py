# app/views/routes.py

from datetime import date
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query

from app.appointments.constants import AppointmentStatus
from app.auth.dependencies import CurrentUser, require_any_role
from app.database import get_db
from app.views.schemas import PaginatedAppointments
from app.views.services import ViewAppointmentService

view_router = APIRouter(prefix="/views", tags=["Appointments - Office Views"])


@view_router.get(
    "/my/appointments",
    response_model=PaginatedAppointments,
    summary="Get appointments created or hosted by current user on a given date",
    description=(
        "Fetch appointments where the current user is either the host or the issuing secretary, "
        "filtered by creation date (defaults to today)."
    ),
)
async def get_my_appointments_on_date(
    on_date: date = Query(
        default_factory=date.today,
        description="Date to filter appointments by (YYYY-MM-DD). Defaults to today.",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("secretary", "host")),
):
    try:
        return await ViewAppointmentService.get_user_appointments_on_date(
            user_id=current_user.id,
            target_date=on_date,
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch your appointments: {e}"
        )


@view_router.get(
    "/{office_id}/appointments",
    response_model=PaginatedAppointments,
    summary="Get appointments in office by status",
    description=(
        "Retrieve paginated appointments for a specific office filtered by status. "
        "Supported statuses: pending, approved, cancelled, completed, not_shown, denied, postponed."
    ),
)
async def get_office_appointments_by_status(
    office_id: UUID,
    status: AppointmentStatus = Query(
        AppointmentStatus.PENDING,
        description="Filter appointments by status",
    ),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_any_role("secretary", "host")),
):
    try:
        return await ViewAppointmentService.get_appointments_by_status(
            office_id=office_id,
            status=status.value,
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch appointments: {e}"
        )


@view_router.get(
    "/{office_id}/search",
    response_model=PaginatedAppointments,
    summary="Search appointments in office",
    description=(
        "Search appointments in the given office by citizen name, email, or purpose. "
        "Case-insensitive partial match."
    ),
)
async def search_office_appointments(
    office_id: UUID,
    search: str = Query(
        ..., description="Search term for citizen name, phone, or email"
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_any_role("secretary", "host")),
):
    try:
        return await ViewAppointmentService.search_office_appointments(
            office_id=office_id,
            query_term=search.strip(),
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@view_router.get(
    "/all/appointments",
    response_model=PaginatedAppointments,
    summary="Get all appointments",
    description=(
        "Retrieve paginated appointments for all offices filtered by status. "
        "Supported statuses: pending, approved, cancelled, completed, not_shown, denied, postponed."
        "this is for recipient"
    ),
)
async def get_all_appointments_by_status(
    status: AppointmentStatus = Query(
        AppointmentStatus.PENDING,
        description="Filter appointments by status",
    ),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(
        require_any_role("admin", "secretary", "reception", "host")
    ),
):
    try:
        return await ViewAppointmentService.get_all_appointments_by_status(
            status=status.value,
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch appointments: {e}"
        )
