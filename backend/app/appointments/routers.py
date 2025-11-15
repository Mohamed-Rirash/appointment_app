from datetime import date, time
from uuid import UUID

from databases import Database
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import StreamingResponse

from app.appointments import schemas as sch
from app.appointments.constants import AppointmentStatus
from app.appointments.crud import AppointmentCrud
from app.appointments.exceptions import (
    AppointmentAlreadyApproved,
    AppointmentCompletionNotAllowed,
    AppointmentDecisionNotAllowed,
    AppointmentEditNotAllowed,
    AppointmentNotFound,
)
from app.appointments.services import AppointmentService
from app.appointments.sms_service import SMSService
from app.auth.dependencies import CurrentUser, require_any_role, require_role
from app.config import get_settings
from app.core.emails.services import send_email
from app.database import get_db
from app.notifications.sse import SSEBroker, office_brokers
from app.views.schemas import AppointmentDetails

settings = get_settings()

appointment_router = APIRouter(prefix="/appointments", tags=["Appointments"])


@appointment_router.post(
    "/with-citizen",
    status_code=status.HTTP_201_CREATED,
    summary="Create citizen and appointment in one request",
)
async def create_with_citizen(
    payload: sch.AppointmentWithCitizenCreate,
    db: Database = Depends(get_db),
    user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
):
    """
    Create a new citizen and an appointment in one request.

    - Validates slot availability
    - Rolls back if any part fails
    - Broadcasts new appointment event via SSE only (no SMS/Email)
    """
    try:
        result = await AppointmentService.create_with_citizen(db, payload, user.id)

        # SSE notification is sent automatically by the service layer
        # No SMS or Email notifications are sent on appointment creation

        return {
            "message": "Appointment created successfully",
            "appointment_id": str(result.appointment.id),
        }

    except AppointmentNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        # Log the full error with traceback
        import traceback

        error_msg = str(e)
        error_type = type(e).__name__
        _error_traceback = traceback.format_exc()

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while creating appointment",
                "error_type": error_type,
                "error": error_msg or "Unknown error occurred",
            },
        )


@appointment_router.get("/events")
async def sse_endpoint(request: Request, office_id: str = Query(...)):
    """
    SSE endpoint for real-time notifications per office.
    """
    try:
        office_uuid = UUID(office_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid office_id format")

    # Get or create broker for this office
    broker = office_brokers.setdefault(office_uuid, SSEBroker())

    # Subscribe client
    queue = await broker.subscribe()

    # Generator function
    async def generate():
        try:
            async for message in broker.event_generator(queue, request):
                yield message
        finally:
            await broker.unsubscribe(queue)

    # Return streaming response with proper headers
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Critical for Nginx
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )


@appointment_router.patch("/{appointment_id}/decision")
async def decide_appointment(
    appointment_id: UUID,
    background_tasks: BackgroundTasks,
    status: AppointmentStatus = Query(
        ..., description="Decision status: approved or denied"
    ),
    office_id: UUID = Query(..., description="Office ID for verification"),
    reason_data: sch.AppointmentDecisionReason | None = None,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
):
    """
    Make a decision on an appointment (approve/deny only).
    Only hosts and secretaries can make decisions.

    **Query Parameters:**
    - `status`: Decision status (approved or denied) - shown as dropdown in UI
    - `office_id`: Office ID for verification

    **Request Body (optional):**
    - `reason`: Optional reason for the decision (recommended for denied status)

    **Notifications:**
    - SMS and Email notifications will be sent to the citizen
    - Notifications include appointment details and decision reason (if provided)
    """
    try:
        # Validate decision status - only approve/deny allowed (postpone removed)
        if status not in [
            AppointmentStatus.APPROVED,
            AppointmentStatus.DENIED,
        ]:
            raise HTTPException(
                status_code=400,
                detail="Decision must be 'approved' or 'denied'. Use the postpone endpoint for rescheduling.",
            )

        # Extract reason from request body (if provided)
        reason = reason_data.reason if reason_data else None

        # Create decision object for service layer
        decision_data = sch.AppointmentDecision(
            status=status,
            reason=reason,
            new_appointment_date=None,
            new_time_slot=None,
        )

        # Handle approve/deny
        updated_appointment = await AppointmentService.decide_appointment(
            db, appointment_id, decision_data, current_user.id, office_id
        )

        # Send SMS and Email notifications in background
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for notifications
                appointment_details = await AppointmentCrud.get_appointment_by_id(
                    db, appointment_id
                )
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"
                    appointment_datetime = appointment_details.appointment_date
                    appointment_date_str = appointment_datetime.strftime(
                        "%B %d, %Y"
                    )  # e.g., "October 25, 2025"
                    appointment_time_str = appointment_datetime.strftime(
                        "%I:%M %p"
                    )  # e.g., "10:00 AM"
                    appointment_datetime_str = appointment_datetime.strftime(
                        "%Y-%m-%d %H:%M"
                    )

                    if status == AppointmentStatus.APPROVED:
                        # Send SMS notification
                        background_tasks.add_task(
                            SMSService.send_appointment_approved_sms,
                            str(appointment_id),
                            appointment_details.citizen_phone,
                            citizen_name,
                            appointment_datetime_str,
                            getattr(appointment_details, "office_name", "Office"),
                        )

                        # Send Email notification
                        if appointment_details.citizen_email:
                            email_context = {
                                "app_name": settings.PROJECT_NAME,
                                "citizen_name": citizen_name,
                                "appointment_id": str(appointment_id),
                                "appointment_date": appointment_date_str,
                                "appointment_time": appointment_time_str,
                                "purpose": appointment_details.purpose,
                                "office_name": getattr(
                                    appointment_details,
                                    "office_name",
                                    "Government Office",
                                ),
                            }

                            background_tasks.add_task(
                                send_email,
                                recipients=appointment_details.citizen_email,
                                subject=f"Appointment Approved - {settings.PROJECT_NAME}",
                                context=email_context,
                                background_tasks=background_tasks,
                                template_name="appointments/appointment-approved-inline.html",
                            )

                    elif status == AppointmentStatus.DENIED:
                        # Send SMS notification
                        background_tasks.add_task(
                            SMSService.send_appointment_denied_sms,
                            str(appointment_id),
                            appointment_details.citizen_phone,
                            citizen_name,
                            reason or "No reason provided",
                        )

                        # Send Email notification
                        if appointment_details.citizen_email:
                            email_context = {
                                "app_name": settings.PROJECT_NAME,
                                "citizen_name": citizen_name,
                                "appointment_id": str(appointment_id),
                                "appointment_date": appointment_date_str,
                                "appointment_time": appointment_time_str,
                                "purpose": appointment_details.purpose,
                                "reason": reason or "No reason provided",
                            }

                            background_tasks.add_task(
                                send_email,
                                recipients=appointment_details.citizen_email,
                                subject=f"Appointment Update - {settings.PROJECT_NAME}",
                                context=email_context,
                                background_tasks=background_tasks,
                                template_name="appointments/appointment-denied-inline.html",
                            )
            except Exception as e:
                # Log error but don't fail the request
                raise HTTPException(status_code=500, detail=str(e))

        return updated_appointment

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AppointmentNotFound as e:
        raise HTTPException(
            status_code=404,
            detail=str(e) if str(e) else "Appointment not found",
        )
    except AppointmentAlreadyApproved:
        raise HTTPException(status_code=400, detail="Appointment already decided")
    except AppointmentDecisionNotAllowed as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.post(
    "/{appointment_id}/postpone",
)
async def postpone_appointment(
    appointment_id: UUID,
    decision: sch.AppointmentDecision,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("host", "secretary")),
):
    """
    Postpone an appointment to a new date/time and mark it as approved.

    This endpoint reschedules a pending appointment to a new date and time,
    then marks it as APPROVED. The citizen will receive a notification with
    the new appointment details.

    **Request Body:**
    - `new_appointment_date`: New appointment date/time (required)
    - `new_time_slot`: New time slot (required)
    - `reason`: Optional reason for the postponement
    """
    try:
        updated_appointment = await AppointmentService.postpone_appointment(
            db, appointment_id, decision, current_user.id
        )

        # Send SMS and Email notifications in background for rescheduled appointment
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for notifications
                appointment_details = await AppointmentCrud.get_appointment_by_id(
                    db, appointment_id
                )
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"

                    # Format new appointment date/time (current appointment_date is now the new date)
                    new_datetime = appointment_details.appointment_date
                    new_date_str = new_datetime.strftime(
                        "%B %d, %Y"
                    )  # e.g., "October 25, 2025"
                    new_time_str = new_datetime.strftime("%I:%M %p")  # e.g., "10:00 AM"
                    new_datetime_str = new_datetime.strftime("%Y-%m-%d %H:%M")

                    # Send SMS notification for approved appointment with new date
                    background_tasks.add_task(
                        SMSService.send_appointment_approved_sms,
                        str(appointment_id),
                        appointment_details.citizen_phone,
                        citizen_name,
                        new_datetime_str,
                        getattr(appointment_details, "office_name", "Office"),
                    )

                    # Send Email notification for approved appointment with new date
                    if appointment_details.citizen_email:
                        email_context = {
                            "app_name": settings.PROJECT_NAME,
                            "citizen_name": citizen_name,
                            "appointment_id": str(appointment_id),
                            "appointment_date": new_date_str,
                            "appointment_time": new_time_str,
                            "purpose": appointment_details.purpose,
                            "office_name": getattr(
                                appointment_details,
                                "office_name",
                                "Government Office",
                            ),
                        }

                        background_tasks.add_task(
                            send_email,
                            recipients=appointment_details.citizen_email,
                            subject=f"Appointment Approved - {settings.PROJECT_NAME}",
                            context=email_context,
                            background_tasks=background_tasks,
                            template_name="appointments/appointment-approved-inline.html",
                        )
            except Exception as e:
                # Log error but don't fail the request
                raise HTTPException(status_code=500, detail=str(e))

        return updated_appointment

    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except AppointmentAlreadyApproved:
        raise HTTPException(status_code=400, detail="Appointment already decided")
    except AppointmentDecisionNotAllowed:
        raise HTTPException(
            status_code=400, detail="Can only postpone pending appointments"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.put(
    "/{appointment_id}",
    response_model=sch.AppointmentRead,
    status_code=status.HTTP_200_OK,
    summary="Edit appointment details",
)
async def edit_appointment(
    appointment_id: UUID,
    update_data: sch.AppointmentUpdate,
    _background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_any_role("reception")),
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
        # Unexpected server error: log and return 500
        raise HTTPException(status_code=500, detail=str(e))


@appointment_router.post("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: UUID,
    cancel_data: sch.AppointmentCancel,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(
        require_any_role("host", "secretary", "reception")
    ),
):
    try:
        updated_appointment = await AppointmentService.cancel_appointment(
            db, appointment_id, cancel_data, current_user.id
        )

        # Send SMS notification in background for cancelled appointment
        if background_tasks and updated_appointment:
            try:
                # Get appointment details with citizen info for SMS
                appointment_details = await AppointmentCrud.get_appointment_by_id(
                    db, appointment_id
                )
                if appointment_details:
                    citizen_name = f"{appointment_details.citizen_firstname} {appointment_details.citizen_lastname}"

                    background_tasks.add_task(
                        SMSService.send_appointment_cancelled_sms,
                        str(appointment_id),
                        appointment_details.citizen_phone,
                        citizen_name,
                        cancel_data.reason,
                    )
            except Exception as e:
                # Log error but don't fail the request
                raise HTTPException(status_code=500, detail=str(e))

        return updated_appointment

    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.post("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: UUID,
    complete_data: sch.AppointmentComplete,
    db: Database = Depends(get_db),
    current_user: CurrentUser = Depends(
        require_any_role("host", "secretary", "reception")
    ),
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
    "/gates/search",
    response_model=list[AppointmentDetails],
    summary="Search approved appointments for gate security",
    description="Search approved appointments by citizen name, phone, or email for gate security verification (only reception)",
)
async def search_approved_appointments(
    search: str = Query(
        ..., description="Search term for citizen name, phone, or email"
    ),
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(require_role("reception")),
):
    try:
        return await AppointmentService.search_approved_appointments(db, search)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@appointment_router.get(
    "/all",
    response_model=list[sch.AppointmentRead],
    summary="Get all appointments",
    deprecated=True,
    description="""
    Get all appointments with support for:
    - Filtering by decision (approved, denied, etc.)
    - Filtering by date/time
    - Searching by citizen info (name, phone, email)
    - Ordered by date/time
    """,
)
async def get_all_appointments(
    by_decision: AppointmentStatus | None = Query(None),
    by_time_slot: time | None = Query(None),
    by_date: date | None = Query(None),
    search: str | None = Query(None),
    completed: bool | None = Query(
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
            status_code=404,
            detail="No appointments found matching the criteria.",
        )


@appointment_router.get(
    "/history",
    response_model=list[sch.AppointmentRead],
    deprecated=True,
    summary="Get appointment history",
    description="Get appointment history with filtering options",
)
async def get_appointment_history(
    status: AppointmentStatus | None = Query(
        None, description="Filter by appointment status"
    ),
    start_date: date | None = Query(None, description="Start date for history range"),
    end_date: date | None = Query(None, description="End date for history range"),
    citizen_id: UUID | None = Query(None, description="Filter by specific citizen"),
    host_id: UUID | None = Query(None, description="Filter by specific host"),
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(
        require_any_role("host", "secretary", "reception")
    ),
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
    deprecated=True,
    summary="Get all appointments id created by default to days date",
    description="Get all appointments",
)
async def get_all_me_appointments(
    db: Database = Depends(get_db),
    user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
    when: date = Query(...),
):
    return AppointmentService.get_my_appointments(db, user.id, when)


@appointment_router.get(
    "/{appointment_id}/print-slip",
    summary="Print appointment slip",
    description="Generate a printable appointment slip with citizen, host, and office information",
    deprecated=True,
)
async def print_appointment_slip(
    appointment_id: UUID,
    db: Database = Depends(get_db),
    _current_user: CurrentUser = Depends(require_any_role("reception", "security")),
):
    try:
        slip_data = await AppointmentService.generate_appointment_slip(
            db, appointment_id
        )
        return slip_data
    except AppointmentNotFound:
        raise HTTPException(status_code=404, detail="Appointment not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
