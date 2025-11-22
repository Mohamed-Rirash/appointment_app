from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_active_offices: int
    total_todays_appointments: int
    total_pending_appointments: int
    total_approved_appointments: int
    total_cancelled_appointments: int
    total_completed_appointments: int

