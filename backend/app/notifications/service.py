"""
Notification service for email and SMS using the existing email service pattern.
Supports both email (via FastMail) and SMS (via SMSCatcher for testing).
"""
import asyncio
from typing import Optional, Dict, Any, List

import httpx
from fastapi.background import BackgroundTasks

from app.config import get_settings
from app.loggs import get_logger
from app.emails.email_config import send_email as send_email_template

logger = get_logger(__name__)
settings = get_settings()


class SMSService:
    """SMS service using SMSCatcher for testing and production SMS providers."""

    @staticmethod
    async def send_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS using configured provider."""
        try:
            if settings.SMS_PROVIDER == "smscatcher":
                # Use SMSCatcher for testing
                return await SMSService._send_smscatcher_sms(phone_number, message, meta)
            elif settings.SMS_PROVIDER == "twilio":
                # Use Twilio for production
                return await SMSService._send_twilio_sms(phone_number, message, meta)
            else:
                logger.warning(f"Unknown SMS provider: {settings.SMS_PROVIDER}")
                return False
        except Exception as e:
            logger.error(f"SMS notification failed: {e}", extra={
                "to": phone_number,
                "provider": settings.SMS_PROVIDER,
                "meta": meta or {},
            })
            return False

    @staticmethod
    async def _send_smscatcher_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS via SMSCatcher (for testing)."""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "to": phone_number,
                    "message": message,
                    "from": settings.SMS_FROM,
                }

                response = await client.post(
                    f"http://{settings.SMS_HOST}:{settings.SMS_PORT}/sms",
                    json=payload,
                    timeout=10.0
                )

                if response.status_code == 200:
                    logger.info("SMS sent via SMSCatcher", extra={
                        "to": phone_number,
                        "status": "success",
                        "provider": "smscatcher",
                        "meta": meta or {},
                    })
                    return True
                else:
                    logger.warning(f"SMSCatcher SMS failed: {response.status_code}", extra={
                        "to": phone_number,
                        "status_code": response.status_code,
                        "response": response.text,
                    })
                    return False

        except Exception as e:
            logger.error(f"SMSCatcher SMS error: {e}", extra={
                "to": phone_number,
                "error": str(e),
            })
            return False

    @staticmethod
    async def _send_twilio_sms(phone_number: str, message: str, meta: Optional[Dict[str, Any]] = None) -> bool:
        """Send SMS via Twilio (for production)."""
        try:
            # Import here to avoid dependency if not using Twilio
            from twilio.rest import Client

            client = Client(settings.SMS_API_KEY, settings.SMS_API_SECRET)

            message = client.messages.create(
                body=message,
                from_=settings.SMS_FROM,
                to=phone_number
            )

            logger.info("SMS sent via Twilio", extra={
                "to": phone_number,
                "message_sid": message.sid,
                "status": "success",
                "provider": "twilio",
                "meta": meta or {},
            })
            return True

        except Exception as e:
            logger.error(f"Twilio SMS error: {e}", extra={
                "to": phone_number,
                "error": str(e),
            })
            return False


class NotificationService:
    """Enhanced notification service with email and SMS support."""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        template_name: str = "email.html",
        background_tasks: Optional[BackgroundTasks] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send email notification using the existing email service."""
        try:
            context = {
                "subject": subject,
                "body": body,
                "recipient": to_email,
            }

            if background_tasks:
                # Use background task for non-blocking
                send_email_template([to_email], subject, context, template_name, background_tasks)
            else:
                # Send immediately for testing
                await send_email_template([to_email], subject, context, template_name, background_tasks or BackgroundTasks())

            logger.info("Email notification queued", extra={
                "to": to_email,
                "subject": subject,
                "meta": meta or {},
            })
            return True

        except Exception as e:
            logger.error(f"Email notification failed: {e}", extra={
                "to": to_email,
                "subject": subject,
                "meta": meta or {},
            })
            return False

    @staticmethod
    async def send_sms(
        phone_number: str,
        message: str,
        meta: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send SMS notification."""
        return await SMSService.send_sms(phone_number, message, meta)

    @staticmethod
    async def notify_user(
        user: Dict[str, Any],
        subject: str,
        message: str,
        template_name: str = "email.html",
        background_tasks: Optional[BackgroundTasks] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, bool]:
        """High-level helper: send email and/or SMS to a user record."""
        results = {
            "email_sent": False,
            "sms_sent": False
        }

        email = user.get("email") or user.get("citizen_email")
        phone = user.get("phone") or user.get("phone_number") or user.get("citizen_phone")

        notification_meta = {
            "user_id": user.get("id"),
            "appointment_id": meta.get("appointment_id") if meta else None,
            "action": meta.get("action") if meta else None,
            **(meta or {})
        }

        # Send email if available
        if email:
            results["email_sent"] = await NotificationService.send_email(
                email, subject, message, template_name, background_tasks, notification_meta
            )

        # Send SMS if available and enabled
        if phone and settings.SMS_ENABLED:
            results["sms_sent"] = await NotificationService.send_sms(
                phone, message, notification_meta
            )

        return results

    @staticmethod
    async def notify_appointment_decision(
        appointment: Dict[str, Any],
        decision: str,
        reason: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Dict[str, bool]:
        """Notify citizen about appointment decision (approve/deny/postpone)."""
        citizen = {
            "email": appointment.get("citizen_email"),
            "phone": appointment.get("citizen_phone"),
            "firstname": appointment.get("citizen_firstname"),
            "lastname": appointment.get("citizen_lastname"),
        }

        # Format messages based on decision
        if decision.lower() == "approved":
            subject = "Appointment Approved"
            sms_message = f"Your appointment has been approved for {appointment.get('appointment_date', 'N/A')} at {appointment.get('time_slotted', 'N/A')}. Please arrive 10 minutes early."
            email_message = f"""
            Dear {citizen['firstname']} {citizen['lastname']},

            Your appointment has been approved!

            Appointment Details:
            - Date: {appointment.get('appointment_date', 'N/A')}
            - Time: {appointment.get('time_slotted', 'N/A')}
            - Purpose: {appointment.get('purpose', 'N/A')}
            - Office: {appointment.get('office_name', 'N/A')}
            - Host: {appointment.get('host_name', 'N/A')}

            Please arrive 10 minutes early and bring valid identification.

            Best regards,
            Appointment Management Team
            """

        elif decision.lower() == "denied":
            subject = "Appointment Request Update"
            sms_message = f"Your appointment request was not approved. Reason: {reason or 'Not specified'}"
            email_message = f"""
            Dear {citizen['firstname']} {citizen['lastname']},

            Your appointment request was not approved.

            Reason: {reason or 'Not specified'}

            Please contact us if you have any questions or would like to reschedule.

            Best regards,
            Appointment Management Team
            """

        elif decision.lower() == "postponed":
            subject = "Appointment Postponed"
            sms_message = f"Your appointment has been postponed. New details will be communicated shortly."
            email_message = f"""
            Dear {citizen['firstname']} {citizen['lastname']},

            Your appointment has been postponed.

            New appointment details will be communicated to you shortly.

            {f'Reason: {reason}' if reason else ''}

            Best regards,
            Appointment Management Team
            """

        else:
            raise ValueError(f"Unknown decision type: {decision}")

        meta = {
            "appointment_id": appointment.get("id"),
            "action": decision.lower(),
            "reason": reason,
        }

        return await NotificationService.notify_user(
            citizen, subject, email_message, "email.html", background_tasks, meta
        )
