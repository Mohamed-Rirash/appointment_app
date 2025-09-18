from databases import Database
from fastapi import APIRouter, Depends

from app.appointments import schemas as sch
from app.appointments.services import AppointmentService
from app.auth.dependencies import CurrentUser, require_any_role
from app.database import get_db

appointment_router = APIRouter(prefix="/appointments", tags=["Appointments"])


@appointment_router.post(
    "/with-citizen",
    response_model=sch.AppointmentWithCitizenRead,
    summary="Create citizen and appointment in one request",
)
async def create_with_citizen(
    payload: sch.AppointmentWithCitizenCreate,
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    return await AppointmentService.create_with_citizen(db, payload)
