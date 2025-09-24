import asyncio

from databases import Database
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse

from app.appointments import schemas as sch
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


#
# @appointment_router.post("/{appointment_id}/decision")
# async def decide_appointment(appointment_id: UUID, decision: str, db: Database):
#     query = (
#         update(appointments)
#         .where(appointments.c.id == appointment_id)
#         .values(status=decision, updated_at=datetime.utcnow())
#         .returning(appointments)
#     )
#     record = await db.fetch_one(query)
#
#     # Notify all office listeners
#     office_id = record["office_id"]
#     if office_id in office_queues:
#         await office_queues[office_id].put(
#             json.dumps({"event": "appointment_update", "data": dict(record)})
#         )
#
#     return dict(record)
