from app.notifications.sms_provider import notify_user


class SMSService:
    """Main SMS service that handles appointment notifications"""

    # Background task functions for SMS notifications
    @staticmethod
    async def send_appointment_approved_sms(
        appointment_id: str,
        citizen_phone: str,
        citizen_name: str,
        appointment_date: str,
        office_name: str,
    ):
        """Background task to send SMS notification for approved appointment"""

        message = (
            f"✅ Your appointment has been APPROVED!\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment on {appointment_date} at {office_name} has been approved.\n"
            f"Please arrive on time.\n\n"
            f"Thank you!"
        )
        return await notify_user(citizen_phone, message)

    @staticmethod
    async def send_appointment_denied_sms(
        appointment_id: str, citizen_phone: str, citizen_name: str, reason: str = ""
    ):
        """Background task to send SMS notification for denied appointment"""
        ...

    @staticmethod
    async def send_appointment_postponed_sms(
        appointment_id: str,
        citizen_phone: str,
        citizen_name: str,
        old_date: str,
        new_date: str,
        reason: str = "",
    ):
        """Background task to send SMS notification for postponed appointment"""
        ...
