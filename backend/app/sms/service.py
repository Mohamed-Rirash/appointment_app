"""
SMS Service for appointment system
Handles SMS notifications using various providers
"""

import os
from typing import Optional, Dict, Any

import httpx

from app.loggs import get_logger

logger = get_logger(__name__)


class SMSService:
    """SMS service using various providers for testing and production."""

    @staticmethod
    async def send_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS using configured provider."""
        try:
            provider = os.getenv("SMS_PROVIDER", "mock")

            if provider == "mock":
                # Use mock service for testing
                return await SMSService._send_mock_sms(phone_number, message, meta)
            elif provider == "smscatcher":
                # Use SMSCatcher for testing
                return await SMSService._send_smscatcher_sms(phone_number, message, meta)
            elif provider == "twilio":
                # Use Twilio for production
                return await SMSService._send_twilio_sms(phone_number, message, meta)
            else:
                logger.warning(f"Unknown SMS provider: {provider}")
                return False
        except Exception as e:
            logger.error(f"SMS notification failed: {e}", extra={
                "to": phone_number,
                "provider": provider,
                "meta": meta or {},
            })
            return False

    @staticmethod
    async def _send_mock_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS via mock service (for testing)."""
        try:
            # For testing, just log the SMS
            print(f"MOCK SMS to {phone_number}: {message}")
            logger.info(f"Mock SMS sent to {phone_number}", extra={
                "phone": phone_number,
                "message": message,
                "meta": meta or {},
            })
            return True
        except Exception as e:
            logger.error(f"Mock SMS failed: {e}")
            return False

    @staticmethod
    async def _send_smscatcher_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS via SMSCatcher (for testing)."""
        try:
            sms_host = os.getenv("SMS_HOST", "localhost")
            sms_port = int(os.getenv("SMS_PORT", "3001"))
            sms_from = os.getenv("SMS_FROM", "+1234567890")

            async with httpx.AsyncClient() as client:
                payload = {
                    "to": phone_number,
                    "message": message,
                    "from": sms_from,
                }

                if meta:
                    payload.update(meta)

                response = await client.post(
                    f"http://{sms_host}:{sms_port}/sms",
                    json=payload,
                    timeout=10.0
                )

                if response.status_code == 200:
                    logger.info(f"SMSCatcher SMS sent to {phone_number}")
                    return True
                else:
                    logger.error(f"SMSCatcher SMS failed with status {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"SMSCatcher SMS failed: {e}")
            return False

    @staticmethod
    async def _send_twilio_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS via Twilio (for production)."""
        try:
            from twilio.rest import Client

            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_FROM_NUMBER", os.getenv("SMS_FROM", "+1234567890"))

            if not account_sid or not auth_token:
                logger.error("Twilio credentials not configured")
                return False

            client = Client(account_sid, auth_token)

            twilio_message = client.messages.create(
                body=message,
                from_=from_number,
                to=phone_number
            )

            logger.info(f"Twilio SMS sent to {phone_number}, SID: {twilio_message.sid}")
            return True

        except Exception as e:
            logger.error(f"Twilio SMS failed: {e}")
            return False
