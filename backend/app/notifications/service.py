from typing import Any

import httpx
from fastapi.background import BackgroundTasks

from app.config import get_settings
from app.core.emails.services import send_email as send_email_template
from app.loggs import get_logger

logger = get_logger(__name__)
settings = get_settings()


class SMSService:
    """SMS service using SMSCatcher for testing and production SMS providers."""

    @staticmethod
    async def send_sms(
        phone_number: str, message: str, meta: dict[str, Any] | None = None
    ) -> bool:
        """Send SMS using configured provider."""
        try:
            if settings.SMS_PROVIDER == "smscatcher":
                # Use SMSCatcher for testing
                return await SMSService._send_smscatcher_sms(
                    phone_number, message, meta
                )
            else:
                logger.warning(f"Unknown SMS provider: {settings.SMS_PROVIDER}")
                return False
        except Exception as e:
            logger.error(
                f"SMS notification failed: {e}",
                extra={
                    "to": phone_number,
                    "provider": settings.SMS_PROVIDER,
                    "meta": meta or {},
                },
            )
            return False

    @staticmethod
    async def _send_smscatcher_sms(
        phone_number: str, message: str, meta: dict[str, Any] | None = None
    ) -> bool:
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
                    timeout=10.0,
                )

                if response.status_code == 200:
                    logger.info(
                        "SMS sent via SMSCatcher",
                        extra={
                            "to": phone_number,
                            "status": "success",
                            "provider": "smscatcher",
                            "meta": meta or {},
                        },
                    )
                    return True
                else:
                    logger.warning(
                        f"SMSCatcher SMS failed: {response.status_code}",
                        extra={
                            "to": phone_number,
                            "status_code": response.status_code,
                            "response": response.text,
                        },
                    )
                    return False

        except Exception as e:
            logger.error(
                f"SMSCatcher SMS error: {e}",
                extra={
                    "to": phone_number,
                    "error": str(e),
                },
            )
            return False


class NotificationService:
    """Enhanced notification service with email and SMS support."""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        template_name: str = "email.html",
        background_tasks: BackgroundTasks | None = None,
        meta: dict[str, Any] | None = None,
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
                await send_email_template(
                    [to_email],
                    subject,
                    context,
                    background_tasks,
                    template_name,
                )
            else:
                # Send immediately for testing
                bg_tasks = BackgroundTasks()
                await send_email_template(
                    [to_email], subject, context, bg_tasks, template_name
                )

            logger.info(
                "Email notification queued",
                extra={
                    "to": to_email,
                    "subject": subject,
                    "meta": meta or {},
                },
            )
            return True

        except Exception as e:
            logger.error(
                f"Email notification failed: {e}",
                extra={
                    "to": to_email,
                    "subject": subject,
                    "meta": meta or {},
                },
            )
            return False

    @staticmethod
    async def send_sms(
        phone_number: str, message: str, meta: dict[str, Any] | None = None
    ) -> bool:
        """Send SMS notification."""
        return await SMSService.send_sms(phone_number, message, meta)

    @staticmethod
    async def notify_user(
        user: dict[str, Any],
        subject: str,
        message: str,
        template_name: str = "email.html",
        background_tasks: BackgroundTasks | None = None,
        meta: dict[str, Any] | None = None,
    ) -> dict[str, bool]:
        """High-level helper: send email and/or SMS to a user record."""
        results = {"email_sent": False, "sms_sent": False}

        email = user.get("email") or user.get("citizen_email")
        phone = (
            user.get("phone") or user.get("phone_number") or user.get("citizen_phone")
        )

        notification_meta = {
            "user_id": user.get("id"),
            "appointment_id": meta.get("appointment_id") if meta else None,
            "action": meta.get("action") if meta else None,
            **(meta or {}),
        }

        # Send email if available
        if email:
            results["email_sent"] = await NotificationService.send_email(
                email,
                subject,
                message,
                template_name,
                background_tasks,
                notification_meta,
            )

        # Send SMS if available and enabled
        if phone and settings.SMS_ENABLED:
            results["sms_sent"] = await NotificationService.send_sms(
                phone, message, notification_meta
            )

        return results

    @staticmethod
    async def notify_appointment_decision(
        appointment: dict[str, Any],
        decision: str,
        reason: str | None = None,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict[str, bool]:
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
            Dear {citizen["firstname"]} {citizen["lastname"]},

            Your appointment has been approved!

            Appointment Details:
            - Date: {appointment.get("appointment_date", "N/A")}
            - Time: {appointment.get("time_slotted", "N/A")}
            - Purpose: {appointment.get("purpose", "N/A")}
            - Office: {appointment.get("office_name", "N/A")}
            - Host: {appointment.get("host_name", "N/A")}

            Please arrive 10 minutes early and bring valid identification.

            Best regards,
            Appointment Management Team
            """

        elif decision.lower() == "denied":
            subject = "Appointment Request Update"
            sms_message = f"Your appointment request was not approved. Reason: {reason or 'Not specified'}"
            email_message = f"""
            Dear {citizen["firstname"]} {citizen["lastname"]},

            Your appointment request was not approved.

            Reason: {reason or "Not specified"}

            Please contact us if you have any questions or would like to reschedule.

            Best regards,
            Appointment Management Team
            """

        elif decision.lower() == "postponed":
            subject = "Appointment Postponed"
            sms_message = "Your appointment has been postponed. New details will be communicated shortly."
            email_message = f"""
            Dear {citizen["firstname"]} {citizen["lastname"]},

            Your appointment has been postponed.

            New appointment details will be communicated to you shortly.

            {f"Reason: {reason}" if reason else ""}

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
            citizen,
            subject,
            email_message,
            "email.html",
            background_tasks,
            meta,
        )
