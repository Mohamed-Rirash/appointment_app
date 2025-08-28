"""
Notification service stubs for email and SMS.
Replace implementations with real providers (e.g., SMTP, Twilio) later.
"""
from typing import Optional, Dict, Any

from app.config import get_settings
from app.loggs import get_logger

logger = get_logger(__name__)
settings = get_settings()


def send_email(to_email: str, subject: str, body: str, meta: Optional[Dict[str, Any]] = None) -> None:
    """Send an email notification (stub)."""
    try:
        logger.info(
            "EMAIL_NOTIFY",
            extra={
                "to": to_email,
                "subject": subject,
                "meta": meta or {},
            },
        )
        # TODO: integrate real email provider (SMTP/API)
    except Exception as e:
        logger.warning(f"Email notification failed: {e}")


def send_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
    """Send an SMS notification (stub)."""
    try:
        logger.info(
            "SMS_NOTIFY",
            extra={
                "to": phone_number,
                "message": message,
                "meta": meta or {},
            },
        )
        # TODO: integrate real SMS provider
    except Exception as e:
        logger.warning(f"SMS notification failed: {e}")


def notify_user(user: Dict[str, Any], subject: str, message: str, meta: Optional[Dict[str, Any]] = None) -> None:
    """High-level helper: send email and/or SMS to a user record."""
    email = user.get("email")
    phone = user.get("phone") or user.get("phone_number")
    if email:
        send_email(email, subject, message, meta)
    if phone:
        send_sms(phone, message, meta)
