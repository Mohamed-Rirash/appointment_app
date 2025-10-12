from sqlalchemy import Table, select

from app.appointments.models import appointments, citizen_info
from app.auth.models import users
from app.database import metadata

appointment_details = Table("appointment_details", metadata)


appointment_details_def = select(
    # Host information
    users.c.id.label("host_id"),
    users.c.first_name.label("host_firstname"),
    users.c.last_name.label("host_lastname"),
    users.c.email.label("host_email"),
    # Appointment information
    appointments.c.id.label("appointment_id"),
    appointments.c.purpose,
    appointments.c.appointment_date,
    appointments.c.time_slotted,
    appointments.c.status,
    appointments.c.is_active.label("appointment_active"),
    appointments.c.created_at,
    appointments.c.updated_at,
    appointments.c.canceled_at,
    appointments.c.canceled_reason,
    appointments.c.issued_by,
    appointments.c.decision_reason,
    appointments.c.decided_at,
    appointments.c.decided_by,
    appointments.c.new_appointment_date,
    # Citizen information
    citizen_info.c.id.label("citizen_id"),
    citizen_info.c.firstname.label("citizen_firstname"),
    citizen_info.c.lastname.label("citizen_lastname"),
    citizen_info.c.email.label("citizen_email"),
    citizen_info.c.phone.label("citizen_phone"),
).select_from(
    appointments
    .join(users, users.c.id == appointments.c.host_id)  # Join with users for host info
    .join(citizen_info, citizen_info.c.id == appointments.c.citizen_id)  # Join with citizen_info for citizen details
)
