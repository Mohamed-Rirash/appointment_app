"""
SMS Types and Configuration for appointment notifications
"""
import os
from typing import Optional


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
    def format_phone_number(cls, phone: str) -> str:
        """Format phone number with country code if needed"""
        if not phone:
            return phone

        # Remove any existing country code or formatting
        cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

        # Add country code if not present
        if not cleaned.startswith("+"):
            cleaned = f"{cls.DEFAULT_COUNTRY_CODE}{cleaned}"

        return cleaned
