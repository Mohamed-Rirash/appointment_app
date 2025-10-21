import httpx
from fastapi import HTTPException

SMS_API_URL = "http://localhost:3001/sms"


async def notify_user(to: str, message: str):
    """
    Function that sends an SMS using the smscatcher service.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                SMS_API_URL,
                json={"to": to, "message": message, "from_": "+919876543210"},
                timeout=5.0,
            )
            response.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to connect to SMS service: {e}"
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code, detail=e.response.text
            )
