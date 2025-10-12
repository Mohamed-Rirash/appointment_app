import asyncio
from datetime import date, time
from typing import Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentCompletionNotAllowed,
    AppointmentDecisionNotAllowed,
    AppointmentEditNotAllowed,
    AppointmentNotFound,
    AppointmentPostponementNotAllowed,
)
from app.appointments.services import AppointmentService
from app.appointments.sms_config import SMSConfig, sms_service
from app.appointments.utils import office_connections
from app.auth.dependencies import CurrentUser, require_any_role
from app.database import get_db

appointment_router = APIRouter(prefix="/appointments", tags=["Appointments"])


# Background task functions for SMS notifications
async def send_appointment_approved_sms(appointment_id: str, citizen_phone: str, citizen_name: str, appointment_date: str, office_name: str):
    """Background task to send SMS notification for approved appointment"""
    await sms_service.send_appointment_approved_task(appointment_id, citizen_phone, citizen_name, appointment_date, office_name)


async def send_appointment_denied_sms(appointment_id: str, citizen_phone: str, citizen_name: str, reason: str = None):
    """Background task to send SMS notification for denied appointment"""
    await sms_service.send_appointment_denied_task(appointment_id, citizen_phone, citizen_name, reason)


async def send_appointment_postponed_sms(appointment_id: str, citizen_phone: str, citizen_name: str, old_date: str, new_date: str, reason: str = None):
    """Background task to send SMS notification for postponed appointment"""
    await sms_service.send_appointment_postponed_task(appointment_id, citizen_phone, citizen_name, old_date, new_date, reason)


async def send_appointment_cancelled_sms(appointment_id: str, citizen_phone: str, citizen_name: str, reason: str):
    """Background task to send SMS notification for cancelled appointment"""
    await sms_service.send_appointment_cancelled_task(appointment_id, citizen_phone, citizen_name, reason)


@appointment_router.post(
    "/with-citizen",
    response_model=sch.AppointmentWithCitizenRead,
    summary="Create citizen and appointment in one request",
)
async def create_with_citizen(
    payload: sch.AppointmentWithCitizenCreate,
    db: Database = Depends(get_db),
    user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    return await AppointmentService.create_with_citizen(db, payload, user.id)
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
    background_tasks: BackgroundTasks = None,
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
):
    try:
        updated_appointment = await AppointmentService.decide_appointment(
            db, appointment_id, decision
        )

        # Send SMS notification in background if appointment was approved or denied
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for SMS
                appointment_details = await AppointmentService.get_appointment_by_id(db, appointment_id)
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"

                    if decision == AppointmentStatus.APPROVED:
                        background_tasks.add_task(
                            send_appointment_approved_sms,
                            str(appointment_id),
                            appointment_details.citizen_phone,
                            citizen_name,
                            appointment_details.appointment_date.strftime("%Y-%m-%d %H:%M"),
                            getattr(appointment_details, 'office_name', 'Office')
                        )
                    elif decision == AppointmentStatus.DENIED:
                        background_tasks.add_task(
                            send_appointment_denied_sms,
                            str(appointment_id),
                            appointment_details.citizen_phone,
                            citizen_name,
                            getattr(appointment_details, 'decision_reason', None)
                        )
            except Exception as e:
                # Log error but don't fail the request
                print(f"Failed to queue SMS notification: {str(e)}")

        return updated_appointment

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
    decision: sch.AppointmentDecision,
    background_tasks: BackgroundTasks = None,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
):
    try:
        updated_appointment = await AppointmentService.postpone_appointment(
            db, appointment_id, decision, current_user.id
        )

        # Send SMS notification in background for postponed appointment
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for SMS
                appointment_details = await AppointmentService.get_appointment_by_id(db, appointment_id)
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"
                    old_date = appointment_details.appointment_date.strftime("%Y-%m-%d %H:%M")
                    new_date = decision.new_appointment_date.strftime("%Y-%m-%d %H:%M") if decision.new_appointment_date else "TBD"

                    background_tasks.add_task(
                        send_appointment_postponed_sms,
                        str(appointment_id),
                        appointment_details.citizen_phone,
                        citizen_name,
                        old_date,
                        new_date,
                        decision.reason
                    )
            except Exception as e:
                # Log error but don't fail the request
                print(f"Failed to queue SMS notification: {str(e)}")

        return updated_appointment

    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except AppointmentAlreadyApproved:
        raise HTTPException(status_code=400, detail="Appointment already decided")
    except AppointmentDecisionNotAllowed:
        raise HTTPException(
            status_code=400, detail="Can only postpone pending appointments"
        )
async def edit_appointment(
    appointment_id: UUID,
    update_data: sch.AppointmentUpdate,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    try:
        updated_appointment = await AppointmentService.edit_appointment(
            db, appointment_id, update_data, current_user.id
        )
        return updated_appointment
    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except AppointmentEditNotAllowed as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.post("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: UUID,
    cancel_data: sch.AppointmentCancel,
    background_tasks: BackgroundTasks = None,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    try:
        updated_appointment = await AppointmentService.cancel_appointment(
            db, appointment_id, cancel_data, current_user.id
        )

        # Send SMS notification in background for cancelled appointment
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for SMS
                appointment_details = await AppointmentService.get_appointment_by_id(db, appointment_id)
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"

                    background_tasks.add_task(
                        send_appointment_cancelled_sms,
                        str(appointment_id),
                        appointment_details.citizen_phone,
                        citizen_name,
                        cancel_data.reason
                    )
            except Exception as e:
                # Log error but don't fail the request
                print(f"Failed to queue SMS notification: {str(e)}")

        return updated_appointment

    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.post("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: UUID,
    complete_data: sch.AppointmentComplete = None,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    try:
        updated_appointment = await AppointmentService.complete_appointment(
            db, appointment_id, complete_data, current_user.id
        )
        return updated_appointment
    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except AppointmentCompletionNotAllowed as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.get(
    "/gate/search",
    response_model=list[sch.AppointmentRead],
    summary="Search approved appointments for gate security",
    description="Search approved appointments by citizen name, phone, or email for gate security verification",
)
async def search_approved_appointments(
    search: str = Query(..., description="Search term for citizen name, phone, or email"),
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("reception", "security")),
):
    try:
        appointments = await AppointmentService.search_approved_appointments(db, search)
        return appointments
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.get(
    "/all",
    response_model=list[sch.AppointmentRead],
    summary="Get all appointments",
    description="""
    Get all appointments with support for:
    - Filtering by decision (approved, denied, etc.)
    - Filtering by date/time
    - Searching by citizen info (name, phone, email)
    - Ordered by date/time
    """,
)
async def get_all_appointments(
    by_decision: Optional[AppointmentStatus] = Query(None),
    by_time_slot: Optional[time] = Query(None),
    by_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    completed: Optional[bool] = Query(
        None, description="Filter only completed appointments"
    ),
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(
        require_any_role("host", "secretary", "reception")
    ),
):
    filters = sch.AppointmentFilters(
        by_decision=by_decision,
        by_time_slot=by_time_slot,
        by_date=by_date,
        search=search,
        completed=completed,
    )
    try:
        return await AppointmentService.get_appointments(db, filters)
    except AppointmentNotFound:
        raise HTTPException(
            status_code=404, detail="No appointments found matching the criteria."
        )


@appointment_router.get(
    "/history",
    response_model=list[sch.AppointmentRead],
    summary="Get appointment history",
    description="Get appointment history with filtering options",
)
async def get_appointment_history(
    status: Optional[AppointmentStatus] = Query(None, description="Filter by appointment status"),
    start_date: Optional[date] = Query(None, description="Start date for history range"),
    end_date: Optional[date] = Query(None, description="End date for history range"),
    citizen_id: Optional[UUID] = Query(None, description="Filter by specific citizen"),
    host_id: Optional[UUID] = Query(None, description="Filter by specific host"),
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    try:
        filters = sch.AppointmentHistoryFilters(
            status=status,
            start_date=start_date,
            end_date=end_date,
            citizen_id=citizen_id,
            host_id=host_id,
        )
        appointments = await AppointmentService.get_appointment_history(db, filters)
        return appointments
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.get(
    "/all/me",
    response_model=list[sch.AppointmentRead],
    summary="Get all appointments",
    description="Get all appointments",
)
async def get_all_me_appointments(
    db: Database = Depends(get_db),
    user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
    when: date = Query(...),  # FIX: make it to days date by default
):
    return AppointmentService.get_my_appointments(db, user.id, when)


@appointment_router.get(
    "/{appointment_id}/print-slip",
    summary="Print appointment slip",
    description="Generate a printable appointment slip with citizen, host, and office information",
)
async def print_appointment_slip(
    appointment_id: UUID,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("reception", "security")),
):
    try:
        slip_data = await AppointmentService.generate_appointment_slip(db, appointment_id)
        return slip_data
    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# TODO: add complete appointment endpoint and make the status complete and deactivate it
