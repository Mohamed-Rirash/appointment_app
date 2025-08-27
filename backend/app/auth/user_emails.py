from app.auth.constants import USER_VERIFY_ACCOUNT, USER_INVITE
from app.auth.security import hash_password
from app.auth.utils import get_context_string
from app.config import get_settings
from app.emails.email_config import send_email
from app.core.security import create_access_token

settings = get_settings()


async def send_account_verification_email(user_data, background_tasks):
    string_context = get_context_string(row=user_data, context=USER_VERIFY_ACCOUNT)
    token = await hash_password(string_context)
    activate_url = f"{settings.FRONTEND_HOST}/users/verify?token={token}&email={user_data['email']}"
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user_data["first_name"],
        "activate_url": activate_url,
    }
    subject = f"Account Verification - {settings.PROJECT_NAME}"
    await send_email(
        recipients=user_data["email"],
        subject=subject,
        template_name="user/account-verification-inline.html",
        context=data,
        background_tasks=background_tasks,
    )


async def send_account_activation_confirmation_email(user, background_tasks):
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user["first_name"],
        "login_url": f"{settings.FRONTEND_HOST}",
    }
    subject = f"Welcome - {settings.PROJECT_NAME}"
    await send_email(
        recipients=[user["email"]],
        subject=subject,
        template_name="user/account-verification-confirmation-inline.html",
        context=data,
        background_tasks=background_tasks,
    )


async def send_password_reset_email(user: dict, reset_token: str, background_tasks):
    """Send password reset email using template."""
    settings = get_settings()
    reset_url = f"{settings.FRONTEND_HOST}/users/reset-password?token={reset_token}&email={user['email']}"
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user["first_name"],
        "activate_url": reset_url,
    }
    subject = f"Password Reset - {settings.PROJECT_NAME}"
    await send_email(
        recipients=user["email"],
        subject=subject,
        template_name="user/password-reset-inline.html",
        context=data,
        background_tasks=background_tasks,
    )


async def send_account_invite_email(user: dict, reset_token: str, background_tasks):
    """Send account invitation email with login and password set link."""
    login_url = f"{settings.FRONTEND_HOST}"
    activate_url = f"{settings.FRONTEND_HOST}/users/set-password?token={reset_token}&email={user['email']}"
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user["first_name"],
        "login_url": login_url,
        "activate_url": activate_url,
    }
    subject = f"You're invited - {settings.PROJECT_NAME}"
    await send_email(
        recipients=[user["email"]],
        subject=subject,
        template_name="user/account-invite-inline.html",
        context=data,
        background_tasks=background_tasks,
    )
