# app/views/routes.py

from datetime import date, timedelta
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query

from app.appointments.constants import AppointmentStatus
from app.auth.dependencies import CurrentUser, require_any_role, require_role
from app.database import get_db
from app.views.schemas import PaginatedAppointments
from app.views.services import ViewAppointmentService

view_router = APIRouter(prefix="/views", tags=["Appointments - Office Views"])


# ---------------------------
# Helper to wrap errors
# ---------------------------
def internal_error(msg: str, exc: Exception):
    raise HTTPException(status_code=500, detail=f"{msg}: {exc}")


# ---------------------------
# 1. My appointments (host/secretary/reception)
# ---------------------------
@view_router.get(
    "/my/appointments",
    response_model=PaginatedAppointments,
    summary="Get appointments created or hosted by current user on a given date",
)
async def get_my_appointments_on_date(
    on_date: date = Query(default_factory=date.today),
    status: AppointmentStatus | None = Query(None, description="Filter by appointment status (optional)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(
        require_any_role("secretary", "host", "reception")
    ),
):
    try:
        return await ViewAppointmentService.get_user_appointments_on_date(
            user_id=current_user.id,
            target_date=on_date,
            status=(status.value if status else None),  # pyright: ignore[reportArgumentType]
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        internal_error("Failed to fetch your appointments", e)


# ---------------------------
# 2. All past appointments for an office
# ---------------------------
@view_router.get(
    "/offices/{office_id}/appointments/past",
    response_model=PaginatedAppointments,
    summary="Get all past appointments for my office (host & secretary)",
)
@view_router.get(
    "/{office_id}/allpastappointments",
    response_model=PaginatedAppointments,
    include_in_schema=False,
)
async def get_all_past_appointments(
    office_id: UUID,
    status: AppointmentStatus | None = Query(None, description="Filter by appointment status"),
    on_date: date | None = Query(None, description="Filter by specific date (default: yesterday)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    _: CurrentUser = Depends(require_any_role("secretary", "host")),
):
    # Set default to yesterday if no date is provided
    if on_date is None:
        on_date = date.today() - timedelta(days=1)
    try:
        return await ViewAppointmentService.get_all_past_appointments(
            office_id=office_id,
            date=on_date,
            status=(
                status.value if status else None
            ),  # pyright: ignore[reportArgumentType]
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        internal_error("Failed to fetch appointments", e)


# ---------------------------
# 3. (Deprecated) Office appointments by status
# ---------------------------
@view_router.get(
    "/{office_id}/appointments",

    response_model=PaginatedAppointments,
    summary="Get appointments in office by status",
)
async def get_office_appointments_by_status(
    office_id: UUID,
    status: AppointmentStatus = Query(AppointmentStatus.PENDING),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    _: CurrentUser = Depends(require_any_role("secretary", "host")),
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
        internal_error("Failed to fetch appointments", e)


# ---------------------------
# 4. Search appointments in an office
# ---------------------------
@view_router.get(
    "/offices/{office_id}/appointments/search",
    response_model=PaginatedAppointments,
    summary="Search appointments in office",
)
@view_router.get(
    "/{office_id}/search",
    response_model=PaginatedAppointments,
    include_in_schema=False,
)
async def search_office_appointments(
    office_id: UUID,
    search: str = Query(..., description="Search by citizen name, email, phone"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    _: CurrentUser = Depends(require_any_role("secretary", "host")),
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
        internal_error("Search failed", e)


# ---------------------------
# 5. Reception: Get all appointments by status
# ---------------------------
# TODO: get all past appointments created by reception
@view_router.get(
    "/reception/appointments",
    response_model=PaginatedAppointments,
    summary="Get all appointments (reception)",
)
@view_router.get(
    "/appointments",
    response_model=PaginatedAppointments,
    include_in_schema=False,
)
async def get_all_appointments_by_status(
    on_date: date = Query(default_factory=date.today),
    status: AppointmentStatus | None = Query(None, description="Filter by appointment status (optional)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("reception")),
):
    try:
        return await ViewAppointmentService.get_user_appointments_on_date(
            user_id=current_user.id,
            target_date=on_date,
            db=db,
            status=(status.value if status else None),  # pyright: ignore[reportArgumentType]
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        internal_error("Failed to fetch appointments", e)


# ---------------------------
# 6. Admin: Appointments by date and status
# ---------------------------
@view_router.get(
    "/admin/appointments",
    response_model=PaginatedAppointments,
    summary="Get all appointments by date and status (admin)",
)
@view_router.get(
    "/allappointments",
    response_model=PaginatedAppointments,
    include_in_schema=False,
)
async def get_all_appointments_by_date_and_status(
    on_date: date = Query(default_factory=date.today),
    status: AppointmentStatus | None = Query(None, description="Filter by appointment status (optional)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
    _: CurrentUser = Depends(require_role("admin")),
):
    try:
        return await ViewAppointmentService.get_all_appointments_by_date_and_status(
            on_date=on_date,
            status=(status.value if status else None),  # pyright: ignore[reportArgumentType]
            db=db,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        internal_error("Failed to fetch appointments", e)
