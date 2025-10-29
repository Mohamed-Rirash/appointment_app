from app.notifications.sms_provider import notify_user



class SMSService:
    """Main SMS service that handles appointment notifications"""

    # Background task functions for SMS notifications
    @staticmethod
    async def send_appointment_created_sms(
        appointment_id: str,
        citizen_phone: str,
        citizen_name: str,
        appointment_date: str,
    ):
        """Background task to send SMS notification for newly created appointment"""
        message = (
            f"📅 Appointment Created!\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment has been scheduled for {appointment_date}.\n"
            f"Status: Pending approval\n\n"
            f"You will receive another notification once your appointment is reviewed.\n\n"
            f"Thank you!"
        )
        return await notify_user(citizen_phone, message)

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
        reason_text = f"\nReason: {reason}" if reason else ""
        message = (
            f"❌ Appointment Denied\n\n"
            f"Dear {citizen_name},\n"
            f"Unfortunately, your appointment request has been denied.{reason_text}\n\n"
            f"Please contact the office for more information.\n\n"
            f"Thank you!"
        )
        return await notify_user(citizen_phone, message)

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
        reason_text = f"\nReason: {reason}" if reason else ""
        message = (
            f"⏰ Appointment Postponed\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment has been rescheduled.\n"
            f"Original date: {old_date}\n"
            f"New date: {new_date}{reason_text}\n\n"
            f"Thank you for your understanding!"
        )
        return await notify_user(citizen_phone, message)

    @staticmethod
    async def send_appointment_cancelled_sms(
        appointment_id: str, citizen_phone: str, citizen_name: str, reason: str = ""
    ):
        """Background task to send SMS notification for cancelled appointment"""
        reason_text = f"\nReason: {reason}" if reason else ""
        message = (
            f"🚫 Appointment Cancelled\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment has been cancelled.{reason_text}\n\n"
            f"Please contact the office if you need to reschedule.\n\n"
            f"Thank you!"
        )
        return await notify_user(citizen_phone, message)
