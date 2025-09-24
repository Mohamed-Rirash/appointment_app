import asyncio
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentDecisionNotAllowed,
    AppointmentNotFound,
)
from app.appointments.services import AppointmentService
from app.appointments.utils import office_connections
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
    # TODO: Add SSE endpoint


@appointment_router.get(
    "/events",
    summary="Get SSE events",
    description="make the client ready for the server to notify the events",
)
async def sse_endpoint(request: Request, office_id: str = Query(...)):
    queue = asyncio.Queue()
    office_connections.setdefault(office_id, []).append(queue)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield data
        finally:
            office_connections[office_id].remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@appointment_router.post("/{appointment_id}/decision")
async def decide_appointment(
    appointment_id: UUID,
    decision: AppointmentStatus = Query(AppointmentStatus.APPROVED),
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
):
    try:
        updated_appointment = await AppointmentService.decide_appointment(
            db, appointment_id, decision
        )
    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except AppointmentAlreadyApproved:
        raise HTTPException(status_code=400, detail="Appointment already approved")
    except AppointmentDecisionNotAllowed:
        raise HTTPException(
            status_code=400, detail="Appointment decision can be approved or denied"
        )


@appointment_router.post("/{appointment_id}/postpone")
async def postpone_appointment(
    appointment_id: UUID,
    decision: AppointmentStatus = Query(AppointmentStatus.POSTPONED),
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
): ...
