from app.auth.constants import USER_VERIFY_ACCOUNT
from app.auth.security import hash_password
from app.auth.utils import get_context_string
from app.config import get_settings
from app.core.emails.services import send_email

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
    print(f"📧 Sending verification email to {user_data['email']}")
    await send_email(
        recipients=user_data["email"],
        subject=subject,
        context=data,
        background_tasks=background_tasks,
        email_type="account_verification",
    )
    print(f"✅ Verification email sent to {user_data['email']}")


async def send_account_activation_confirmation_email(user, background_tasks):
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user["first_name"],
        "login_url": f"{settings.FRONTEND_HOST}",
        "message": "Your account has been successfully activated! You can now log in to your account.",
    }
    subject = f"Welcome - {settings.PROJECT_NAME}"
    await send_email(
        recipients=[user["email"]],
        subject=subject,
        context=data,
        background_tasks=background_tasks,
        email_type="account_verification_confirmation",
    )


async def send_password_reset_email(user: dict, reset_token: str, background_tasks):
    """Send password reset email using template."""
    settings = get_settings()
    reset_url = f"{settings.FRONTEND_HOST}/users/reset-password?token={reset_token}&email={user['email']}"
    data = {
        "app_name": settings.PROJECT_NAME,
        "name": user["first_name"],
        "activate_url": reset_url,
        "message": f"Please click the following link to reset your password: {reset_url}",
    }
    subject = f"Password Reset - {settings.PROJECT_NAME}"
    await send_email(
        recipients=user["email"],
        subject=subject,
        context=data,
        background_tasks=background_tasks,
        email_type="password_reset",
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
        "message": f"You've been invited to join {settings.PROJECT_NAME}. Click here to set up your account: {activate_url}",
    }
    subject = f"You're invited - {settings.PROJECT_NAME}"
    print(f"📧 Sending invitation email to {user['email']}")
    await send_email(
        recipients=[user["email"]],
        subject=subject,
        context=data,
        background_tasks=background_tasks,
        email_type="account_invite",
    )
    print(f"✅ Invitation email sent to {user['email']}")
