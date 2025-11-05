from enum import Enum


class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    POSTPONED = "POSTPONED"


# class AppointmentStatus(str, Enum):
#     PENDING = "pending"
#     CANCELLED = "cancelled"
#     COMPLETED = "completed"
#     NO_SHOW = "no_show"
#     APPROVED = "approved"
#     DENIED = "denied"
#     POSTPONED = "postponed"
