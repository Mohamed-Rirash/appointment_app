from enum import Enum


class AppointmentStatus(str, Enum):
    PENDING = "spending"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    Approved = "approved"
    DENIED = "denied"
