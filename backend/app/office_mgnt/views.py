from sqlalchemy import Table, select

from app.auth.models import users
from app.database import metadata
from app.office_mgnt.models import office_memberships, offices

office_member_details = Table("office_member_details", metadata)

office_member_details_def = select(
    users.c.id.label("user_id"),
    users.c.first_name,
    users.c.last_name,
    users.c.email,
    users.c.is_active.label("user_active"),
    office_memberships.c.id.label("membership_id"),
    office_memberships.c.office_id,
    office_memberships.c.position,
    office_memberships.c.is_primary,
    office_memberships.c.is_active.label("membership_active"),
    office_memberships.c.assigned_at,
    office_memberships.c.ended_at,
    offices.c.name.label("office_name"),
    offices.c.location.label("office_location"),
).select_from(
    office_memberships.join(users, users.c.id == office_memberships.c.user_id).join(
        offices, offices.c.id == office_memberships.c.office_id
    )
)
