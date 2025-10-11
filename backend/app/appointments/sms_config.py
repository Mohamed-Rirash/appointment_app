"""
SMS Configuration for appointment notifications
"""
import os
from typing import Optional

from app.appointments.sms_providers import MockSMSProvider, TwilioSMSProvider, DockerSMSCatcherProvider
from app.appointments.sms_service import SMSService
from app.appointments.sms_types import SMSConfig as SMSConfigClass


class SMSConfig:
    """Configuration for SMS notifications"""

    # Enable/disable SMS notifications (default: enabled for development)
    SMS_ENABLED: bool = os.getenv("SMS_ENABLED", "true").lower() == "true"

    # SMS Provider (mock, twilio, docker_catcher)
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock")

    # Docker SMS Catcher configuration (if using Docker SMS Catcher)
    SMS_CATCHER_URL: str = os.getenv("SMS_CATCHER_URL", "http://localhost:3000")

    # Twilio configuration (if using Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")

    # Phone number formatting (some countries need specific formatting)
    DEFAULT_COUNTRY_CODE: str = os.getenv("DEFAULT_COUNTRY_CODE", "+1")

    @classmethod
    def get_sms_service(cls) -> SMSService:
        """Get configured SMS service instance"""
        if not cls.SMS_ENABLED:
            # Return a disabled service that does nothing
            return DisabledSMSService()

        if cls.SMS_PROVIDER.lower() == "twilio":
            if not all([cls.TWILIO_ACCOUNT_SID, cls.TWILIO_AUTH_TOKEN, cls.TWILIO_PHONE_NUMBER]):
                print("Warning: Twilio credentials not complete, falling back to mock SMS")
                return SMSService(MockSMSProvider())

            provider = TwilioSMSProvider(
                account_sid=cls.TWILIO_ACCOUNT_SID,
                auth_token=cls.TWILIO_AUTH_TOKEN,
                from_phone=cls.TWILIO_PHONE_NUMBER
            )
            return SMSService(provider)

        elif cls.SMS_PROVIDER.lower() == "docker_catcher":
            provider = DockerSMSCatcherProvider(catcher_url=cls.SMS_CATCHER_URL)
            return SMSService(provider)

        # Default to mock provider for development
        return SMSService(MockSMSProvider())

    @classmethod
    def format_phone_number(cls, phone: str) -> str:
        """Format phone number with country code if needed"""
        return SMSConfigClass.format_phone_number(phone)


class DisabledSMSService(SMSService):
    """SMS service that does nothing (for when SMS is disabled)"""

    async def send_appointment_approved(self, citizen_phone: str, citizen_name: str,
                                      appointment_date: str, office_name: str) -> bool:
        print(f"📱 SMS DISABLED: Would send approval to {citizen_phone}")
        return True

    async def send_appointment_denied(self, citizen_phone: str, citizen_name: str,
                                    reason: Optional[str] = None) -> bool:
        print(f"📱 SMS DISABLED: Would send denial to {citizen_phone}")
        return True

    async def send_appointment_postponed(self, citizen_phone: str, citizen_name: str,
                                       old_date: str, new_date: str, reason: Optional[str] = None) -> bool:
        print(f"📱 SMS DISABLED: Would send postponement to {citizen_phone}")
        return True


# Global SMS service instance (configured)
sms_service = SMSConfig.get_sms_service()
