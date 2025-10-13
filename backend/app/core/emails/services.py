# app/core/email_service.py

from typing import Optional, Union

from fastapi import BackgroundTasks
from fastapi_mail import ConnectionConfig, FastMail, MessageType, MultipartSubtypeEnum
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, EmailStr, model_validator

from app.config import get_settings
from app.core.emails.email_config import get_email_settings


class FixedMessageSchema(BaseModel):
    """Fixed MessageSchema that works with Pydantic v2 and FastMail"""
    recipients: list[EmailStr]
    attachments: list = []
    subject: str = ""
    body: Optional[Union[str, list]] = None
    alternative_body: Optional[str] = None
    template_body: Optional[Union[list, dict, str]] = None
    cc: list[EmailStr] = []
    bcc: list[EmailStr] = []
    reply_to: list[EmailStr] = []
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    charset: str = "utf-8"
    subtype: MessageType
    multipart_subtype: MultipartSubtypeEnum = MultipartSubtypeEnum.mixed
    headers: Optional[dict] = None

    @model_validator(mode="after")
    def validate_alternative_body(self):
        """
        Validate alternative_body field - fixed for Pydantic v2
        """
        if (
            self.multipart_subtype != MultipartSubtypeEnum.alternative
            and self.alternative_body
        ):
            self.alternative_body = None
        return self

    def to_message_schema(self):
        """Convert to original MessageSchema for FastMail compatibility"""
        from fastapi_mail import MessageSchema

        # Create a MessageSchema instance by bypassing validation entirely
        # We'll use model_construct and then manually set the internal state
        message = MessageSchema.model_construct()

        # Set all attributes manually
        message.recipients = self.recipients
        message.attachments = self.attachments
        message.subject = self.subject
        message.body = self.body
        message.alternative_body = self.alternative_body
        message.template_body = self.template_body
        message.cc = self.cc
        message.bcc = self.bcc
        message.reply_to = self.reply_to
        message.from_email = self.from_email
        message.from_name = self.from_name
        message.charset = self.charset
        message.subtype = self.subtype
        message.multipart_subtype = self.multipart_subtype
        message.headers = self.headers

        return message

email_settings = get_email_settings()
app_settings = get_settings()

# =====================================================
# Configure FastAPI-Mail Connection
# =====================================================
conf = ConnectionConfig(
    MAIL_USERNAME=email_settings.MAIL_USERNAME,
    MAIL_PASSWORD=email_settings.MAIL_PASSWORD,
    MAIL_FROM=email_settings.MAIL_FROM,
    MAIL_PORT=email_settings.MAIL_PORT,
    MAIL_SERVER=email_settings.MAIL_SERVER,
    MAIL_STARTTLS=email_settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=email_settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=email_settings.USE_CREDENTIALS,
    VALIDATE_CERTS=False,
    MAIL_FROM_NAME=email_settings.MAIL_FROM_NAME,
    MAIL_DEBUG=email_settings.MAIL_DEBUG,
    TEMPLATE_FOLDER=str(email_settings.TEMPLATE_FOLDER),
)


# =====================================================
# Optional: Jinja2 environment for template rendering
# =====================================================
jinja_env = Environment(
    loader=FileSystemLoader(email_settings.TEMPLATE_FOLDER),
    autoescape=select_autoescape(["html", "xml"]),
)


# =====================================================
# Send Email Function
# =====================================================
async def send_email(
    recipients: Union[str, list[str]],
    subject: str,
    context: dict,
    background_tasks: BackgroundTasks,
    template_name: Optional[str] = None,
    email_type: Optional[str] = None,
):
    """
    Send email using FastAPI-Mail with HTML templates
    """

    if isinstance(recipients, str):
        recipients = [recipients]

    # Determine template based on email type or provided template_name
    if template_name:
        template_path = template_name
    elif email_type:
        # Map email types to template files
        template_mapping = {
            "account_invite": "user/account-invite-inline.html",
            "account_verification": "user/account-verification-inline.html",
            "password_reset": "user/password-reset-inline.html",
            "account_verification_confirmation": "user/account-verification-confirmation-inline.html",
        }
        template_path = template_mapping.get(email_type, "user/account-invite-inline.html")
    else:
        # Default to account invite template
        template_path = "user/account-invite-inline.html"

    # Render HTML template
    template = jinja_env.get_template(template_path)
    html_content = template.render(**context)
    message_type = MessageType.html
    body = html_content

    # Create email message using fixed schema and convert to original for FastMail
    fixed_message = FixedMessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=message_type,
    )

    # Convert to original MessageSchema for FastMail compatibility
    message = fixed_message.to_message_schema()

    fm = FastMail(conf)

    # Send in background
    background_tasks.add_task(fm.send_message, message)

    print(f"📧 Sending email to {recipients} with subject: '{subject}'")


# =====================================================
# Example Usage
# =====================================================
# from fastapi import BackgroundTasks
# background_tasks = BackgroundTasks()
# await send_email(
#     recipients="user@example.com",
#     subject="Welcome to MyApp!",
#     context={
#         "name": "John",
#         "message": "Your account has been created!",
#         "activate_url": "https://myapp.com/activate",
#     },
#     background_tasks=background_tasks,
#     template_name="welcome.html",  # optional
# )
