import httpx
from fastapi import HTTPException
from app.config import get_settings

settings = get_settings()

# Use environment variable for SMS API URL, default to smscatcher service in Docker
SMS_API_URL = settings.SMS_API_URL if hasattr(settings, 'SMS_API_URL') else "http://smscatcher:3001/sms"


async def notify_user(to: str, message: str):
    """
    Function that sends an SMS using the smscatcher service.
    """
    async with httpx.AsyncClient() as client:
        try:
            print(f"📱 Sending SMS to {to} via {SMS_API_URL}")
            response = await client.post(
                SMS_API_URL,
                json={"to": to, "message": message, "from_": "+919876543210"},
                timeout=5.0,
            )
            response.raise_for_status()
            print(f"✅ SMS sent successfully to {to}")
            return True
        except httpx.RequestError as e:
            error_msg = f"Failed to connect to SMS service: {e}"
            print(f"❌ SMS Error: {error_msg}")
            # Don't raise HTTPException in background tasks, just log and return False
            return False
        except httpx.HTTPStatusError as e:
            error_msg = f"SMS service returned error: {e.response.status_code} - {e.response.text}"
            print(f"❌ SMS Error: {error_msg}")
            return False
        except Exception as e:
            error_msg = f"Unexpected error sending SMS: {str(e)}"
            print(f"❌ SMS Error: {error_msg}")
            return False
