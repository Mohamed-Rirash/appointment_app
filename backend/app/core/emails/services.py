import httpx
from fastapi import BackgroundTasks
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.emails.email_config import get_email_settings

email_settings = get_email_settings()


class EmailService:
    """Lightweight Resend API email client."""

    RESEND_URL = "https://api.resend.com/emails"

    def __init__(self):
        self.api_key = email_settings.MAIL_PASSWORD.get_secret_value()
        self.from_header = (
            f"{email_settings.MAIL_FROM_NAME} <{email_settings.MAIL_FROM}>"
        )

    async def _send(self, data: dict):
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                self.RESEND_URL,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=data,
            )

            if response.status_code >= 400:
                print("❌ Resend Error:", response.text)

            response.raise_for_status()

    def schedule_send(
        self,
        recipients: list[str],
        subject: str,
        html_body: str,
        background_tasks: BackgroundTasks,
    ) -> None:
        data = {
            "from": self.from_header,
            "to": recipients,
            "subject": subject,
            "html": html_body,
        }

        background_tasks.add_task(self._send, data)


email_service = EmailService()


# -------------------------------------------------------
# Jinja2 template engine
# -------------------------------------------------------
jinja_env = Environment(
    loader=FileSystemLoader(email_settings.TEMPLATE_FOLDER),
    autoescape=select_autoescape(["html", "xml"]),
)


async def send_email(
    recipients: str | list[str],
    subject: str,
    context: dict,
    background_tasks: BackgroundTasks,
    template_name: str | None = None,
    email_type: str | None = None,
):
    """Render template and queue email via Resend."""

    if isinstance(recipients, str):
        recipients = [recipients]

    template_path = template_name or _map_email_type_to_template(email_type)
    template = jinja_env.get_template(template_path)
    html_content = template.render(**context)

    email_service.schedule_send(recipients, subject, html_content, background_tasks)


def _map_email_type_to_template(email_type: str | None) -> str:
    mapping = {
        "account_invite": "user/account-invite-inline.html",
        "account_verification": "user/account-verification-inline.html",
        "password_reset": "user/password-reset-inline.html",
        "account_verification_confirmation": "user/account-verification-confirmation-inline.html",
    }
    return mapping.get(email_type, "user/account-invite-inline.html")
