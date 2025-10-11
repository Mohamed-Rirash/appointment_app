"""
SMS Service for appointment notifications
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional

from app.appointments.sms_providers import SMSProvider, MockSMSProvider, DockerSMSCatcherProvider, TwilioSMSProvider
from app.appointments.sms_types import SMSConfig

logger = logging.getLogger(__name__)


class SMSService:
    """Main SMS service that handles appointment notifications"""

    def __init__(self, provider: Optional[SMSProvider] = None):
        self.provider = provider or MockSMSProvider()

    def set_provider(self, provider: SMSProvider):
        """Change the SMS provider"""
        self.provider = provider

    async def send_appointment_approved(self, citizen_phone: str, citizen_name: str,
                                      appointment_date: str, office_name: str) -> bool:
        """Send SMS notification for approved appointment"""
        message = (
            f"✅ Your appointment has been APPROVED!\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment on {appointment_date} at {office_name} has been approved.\n"
            f"Please arrive on time.\n\n"
            f"Thank you!"
        )
        return await self.provider.send_sms(citizen_phone, message)

    async def send_appointment_denied(self, citizen_phone: str, citizen_name: str,
                                    reason: Optional[str] = None) -> bool:
        """Send SMS notification for denied appointment"""
        message = (
            f"❌ Your appointment request has been DENIED.\n\n"
            f"Dear {citizen_name},\n"
            f"We regret to inform you that your appointment request has been denied."
        )

        if reason:
            message += f"\n\nReason: {reason}"

        message += "\n\nPlease contact us for more information."

        return await self.provider.send_sms(citizen_phone, message)

    async def send_appointment_postponed(self, citizen_phone: str, citizen_name: str,
                                       old_date: str, new_date: str, reason: Optional[str] = None) -> bool:
        """Send SMS notification for postponed appointment"""
        message = (
            f"📅 Your appointment has been POSTPONED.\n\n"
            f"Dear {citizen_name},\n"
            f"Your appointment scheduled for {old_date} has been postponed to {new_date}."
        )

        if reason:
            message += f"\n\nReason: {reason}"

        message += "\n\nPlease confirm your attendance."

        return await self.provider.send_sms(citizen_phone, message)

    # Background task functions that can be used with FastAPI BackgroundTasks
    async def send_appointment_approved_task(self, appointment_id: str, citizen_phone: str, citizen_name: str, appointment_date: str, office_name: str):
        """Background task wrapper for approved appointment SMS"""
        try:
            formatted_phone = SMSConfig.format_phone_number(citizen_phone)
            await self.send_appointment_approved(
                citizen_phone=formatted_phone,
                citizen_name=citizen_name,
                appointment_date=appointment_date,
                office_name=office_name
            )
            print(f"✅ SMS notification sent for approved appointment {appointment_id}")
        except Exception as e:
            print(f"❌ Failed to send SMS notification for approved appointment {appointment_id}: {str(e)}")

    async def send_appointment_denied_task(self, appointment_id: str, citizen_phone: str, citizen_name: str, reason: str = None):
        """Background task wrapper for denied appointment SMS"""
        try:
            formatted_phone = SMSConfig.format_phone_number(citizen_phone)
            await self.send_appointment_denied(
                citizen_phone=formatted_phone,
                citizen_name=citizen_name,
                reason=reason
            )
            print(f"✅ SMS notification sent for denied appointment {appointment_id}")
        except Exception as e:
            print(f"❌ Failed to send SMS notification for denied appointment {appointment_id}: {str(e)}")

    async def send_appointment_postponed_task(self, appointment_id: str, citizen_phone: str, citizen_name: str, old_date: str, new_date: str, reason: str = None):
        """Background task wrapper for postponed appointment SMS"""
        try:
            formatted_phone = SMSConfig.format_phone_number(citizen_phone)
            await self.send_appointment_postponed(
                citizen_phone=formatted_phone,
                citizen_name=citizen_name,
                old_date=old_date,
                new_date=new_date,
                reason=reason
            )
            print(f"✅ SMS notification sent for postponed appointment {appointment_id}")
        except Exception as e:
            print(f"❌ Failed to send SMS notification for postponed appointment {appointment_id}: {str(e)}")

    async def send_appointment_cancelled_task(self, appointment_id: str, citizen_phone: str, citizen_name: str, reason: str):
        """Background task wrapper for cancelled appointment SMS"""
        try:
            formatted_phone = SMSConfig.format_phone_number(citizen_phone)
            await self.send_appointment_denied(
                citizen_phone=formatted_phone,
                citizen_name=citizen_name,
                reason=f"Appointment cancelled: {reason}"
            )
            print(f"✅ SMS notification sent for cancelled appointment {appointment_id}")
        except Exception as e:
            print(f"❌ Failed to send SMS notification for cancelled appointment {appointment_id}: {str(e)}")


# Global SMS service instance
sms_service = SMSService()
