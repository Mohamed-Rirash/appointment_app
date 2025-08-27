import os
from pathlib import Path

from fastapi.background import BackgroundTasks
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.config import get_settings

settings = get_settings()

# Set TEMPLATE_FOLDER to the correct path inside the app
TEMPLATE_FOLDER = Path(__file__).parent.parent / "templates"
if not TEMPLATE_FOLDER.exists():
    TEMPLATE_FOLDER.mkdir(parents=True, exist_ok=True)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    MAIL_DEBUG=settings.MAIL_DEBUG,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    TEMPLATE_FOLDER=str(TEMPLATE_FOLDER),
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    SUPPRESS_SEND=settings.SUPPRESS_SEND,
)

fm = FastMail(conf)


async def send_email(
    recipients: list | str,
    subject: str,
    context: dict,
    template_name: str,
    background_tasks: BackgroundTasks,
):
    # Ensure recipients is a list
    if isinstance(recipients, str):
        recipients = [recipients]
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        template_body=context,
        subtype=MessageType.html,
    )

    background_tasks.add_task(fm.send_message, message, template_name=template_name)
