from datetime import date, datetime, timedelta
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


def generate_slots(start_time, end_time, interval=15):
    slots = []
    current = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)

    while current + timedelta(minutes=interval) <= end_dt:
        slots.append(
            {
                "slot_start": current,
                "slot_end": current + timedelta(minutes=interval),
            }
        )
        current += timedelta(minutes=interval)
    return slots
