"""
SMS Provider implementations for appointment notifications
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class SMSProvider(ABC):
    """Abstract base class for SMS providers"""

    @abstractmethod
    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Send SMS message. Returns True if successful, False otherwise"""
        pass


class MockSMSProvider(SMSProvider):
    """Mock SMS provider for development/testing"""

    def __init__(self):
        self.sent_messages = []

    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Simulate sending SMS"""
        try:
            # Simulate network delay
            await asyncio.sleep(0.1)

            # Store the message for testing/logging
            self.sent_messages.append({
                'to': to_phone,
                'message': message,
                'timestamp': asyncio.get_event_loop().time()
            })

            logger.info(f"📱 MOCK SMS sent to {to_phone}: {message}")
            return True

        except Exception as e:
            logger.error(f"Failed to send mock SMS to {to_phone}: {str(e)}")
            return False


class DockerSMSCatcherProvider(SMSProvider):
    """Docker SMS Catcher provider for development"""

    def __init__(self, catcher_url: str = "http://localhost:3000"):
        self.catcher_url = catcher_url.rstrip('/')

    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Send SMS via Docker SMS Catcher"""
        try:
            import aiohttp

            # Format the request for SMS Catcher
            payload = {
                "to": to_phone,
                "message": message
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.catcher_url}/sms", json=payload) as response:
                    if response.status == 200:
                        logger.info(f"📱 SMS sent via Docker SMS Catcher to {to_phone}")
                        return True
                    else:
                        logger.error(f"Failed to send SMS via Docker SMS Catcher: HTTP {response.status}")
                        return False

        except Exception as e:
            logger.error(f"Failed to send SMS via Docker SMS Catcher to {to_phone}: {str(e)}")
            return False


class TwilioSMSProvider(SMSProvider):
    """Twilio SMS provider for production"""

    def __init__(self, account_sid: str, auth_token: str, from_phone: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_phone = from_phone

    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client

            client = Client(self.account_sid, self.auth_token)

            message = client.messages.create(
                body=message,
                from_=self.from_phone,
                to=to_phone
            )

            logger.info(f"📱 SMS sent via Twilio to {to_phone}, SID: {message.sid}")
            return True

        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio to {to_phone}: {str(e)}")
            return False
