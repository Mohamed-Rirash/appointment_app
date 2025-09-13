from enum import Enum
from uuid import UUID

from databases import Database

from app.auth.rbac import RBACCRUD


async def has_excluded_role(session: Database, user_id: UUID) -> bool:
    excluded_roles = ["secretary", "secretry", "reception"]
    user_roles = await RBACCRUD.get_user_roles(session, user_id)
    role_names = [r.get("name", "").lower() for r in user_roles] if user_roles else []

    # exclude if any of the roles match
    return any(role in excluded_roles for role in role_names)


class Daysofweek(str, Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"
