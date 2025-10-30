# Service layer for authentication logic

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.auth.config import get_auth_settings
from app.auth.constants import USER_VERIFY_ACCOUNT
from app.auth.crud import UserCRUD
from app.auth.rbac import RBACCRUD
from app.auth.security import hash_password, verify_password
from app.auth.user_emails import (
    send_account_activation_confirmation_email,
    send_account_verification_email,
    send_password_reset_email,
)
from app.auth.utils import get_context_string
from app.config import get_settings
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    generate_password_reset_token,
    is_jti_revoked,
    revoke_token_jti,
    verify_password_reset_token,
    verify_token,
)

settings = get_auth_settings()
app_settings = get_settings()


async def create_user_service(session, user):
    user_id = uuid.uuid4()
    user_data = user.model_dump()
    if await UserCRUD.get_by_email(session, user_data["email"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="this email is not available",
        )
    user_data["id"] = user_id
    user_data["password"] = await hash_password(user_data["password"])

    return await UserCRUD.create(session, user_data)


async def activate_user_account(data, session, background_tasks):
    user = await UserCRUD.get_by_email(session, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="This link is not valid.")

    user_token = get_context_string(row=user, context=USER_VERIFY_ACCOUNT)
    try:
        token_valid = await verify_password(data.token, user_token)
    except Exception as verify_exec:
        print(verify_exec)
        token_valid = False
    if not token_valid:
        raise HTTPException(
            status_code=400, detail="This link either expired or not valid."
        )
    # update user via CRUD
    await UserCRUD.update(
        session,
        user["id"],
        {"is_active": True, "verified_at": datetime.now(), "is_verified": True},
    )
    # Activation confirmation email

    await send_account_activation_confirmation_email(user, background_tasks)
    return user


async def user_authenticate_service(session, data, response):
    user = await UserCRUD.get_by_email(session, data.username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not await verify_password(user["password"], data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user["is_verified"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="your acount has not been verified please contact the admin",
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="your acount has been deactivated please contact the admin",
        )

    return await _generate_tokens(user, session, response)


async def logout_user_service(session, request, response, current_user) -> None:
    """Perform logout by invalidating access and refresh tokens and clearing cookies.

    - Revoke current access token JTI (if present in Authorization header)
    - Revoke and delete current refresh token (if present in cookie)
    - Delete any remaining refresh tokens for the user
    - Clear refresh token cookie
    """
    # Attempt to revoke current access token (best-effort)
    try:
        auth_header = request.headers.get("authorization") or request.headers.get(
            "Authorization"
        )
        if auth_header and auth_header.lower().startswith("bearer "):
            access_token = auth_header.split(" ", 1)[1]
            payload = verify_token(access_token, token_type="access")
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                await revoke_token_jti(jti, exp)
    except Exception:
        pass

    # Handle refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        # Revoke refresh token JTI and delete from DB
        try:
            payload = verify_token(refresh_token, token_type="refresh")
            rjti = payload.get("jti")
            rexp = payload.get("exp")
            if rjti and rexp:
                await revoke_token_jti(rjti, rexp)
        except Exception:
            pass

    # Clear refresh token cookie
    refresh_path = f"{app_settings.API_V1_STR}/users/refresh"
    response.delete_cookie(
        "refresh_token",
        path=refresh_path,
        secure=True,  # Must match how the cookie was set
        httponly=True,
        samesite="lax"
    )


async def get_current_user_profile_service(session, current_user):
    """Get current user profile with role and permission names."""
    # Fetch roles and permissions using RBAC CRUD helpers
    user_roles = await RBACCRUD.get_user_roles(session, current_user.id)
    role_names = [r.get("name") for r in user_roles] if user_roles else []

    user_perms = await RBACCRUD.get_user_permissions(session, current_user.id)
    perm_names = (
        list({f"{p['resource']}:{p['action']}" for p in user_perms})
        if user_perms
        else []
    )
    member_offices = await UserCRUD.get_users_office_by_id(session, current_user.id)

    # Initialize with None in case no office is found
    office_id = None
    position = None

    if member_offices:
        office_id = member_offices.get("office_id")
        position = member_offices.get("position")

    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
        "roles": role_names,
        "permissions": perm_names,
        "office_id": office_id,
        "position": position,
    }


async def change_password_service(session, current_user, request):
    """Change the current user's password after verifying current password."""
    user = await UserCRUD.get_by_id(session, current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not await verify_password(user["password"], request.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    new_password_hash = await hash_password(request.new_password)
    await UserCRUD.update(session, current_user.id, {"password": new_password_hash})


async def request_password_reset_service(session, request, background_tasks):
    """Request a password reset by sending an email with a reset token."""
    user = await UserCRUD.get_by_email(session, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    reset_token = generate_password_reset_token(user["id"])
    await send_password_reset_email(user, reset_token, background_tasks)


async def reset_password_service(session, request):
    """Reset password using a valid reset token."""
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired reset token",
        )

    new_password_hash = await hash_password(request.new_password)
    result = await UserCRUD.update(
        session,
        user_id,  # pyright: ignore[reportArgumentType]
        {"password": new_password_hash, "is_verified": True, "is_active": True},
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )


async def set_password_first_time_service(session, request):
    """Set password for first-time login using invitation/reset token."""
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    new_password_hash = await hash_password(request.new_password)
    result = await UserCRUD.update(
        session,
        user_id,  # pyright: ignore[reportArgumentType]
        {"password": new_password_hash, "is_verified": True, "is_active": True},
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )


async def resend_verification_email_service(session, request, background_tasks):
    """Resend email verification to a user if not already verified."""
    user = await UserCRUD.get_by_email(session, request.email)
    if not user:
        return  # Don't reveal if email exists or not

    if user["is_verified"]:
        return  # Already verified

    await send_account_verification_email(user, background_tasks)


async def _generate_tokens(user, session, response):
    # Token expiration settings
    at_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    rt_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    expiry_time = datetime.now(UTC) + rt_expires

    # Create tokens
    access_token = create_access_token(subject=user["id"], expires_delta=at_expires)
    refresh_token = create_refresh_token(subject=user["id"], expires_delta=rt_expires)

    # Set refresh token cookie with security settings
    refresh_path = f"{app_settings.API_V1_STR}/users/refresh"
    cookie_kwargs = {
        "key": "refresh_token",
        "value": refresh_token,
        "max_age": int(rt_expires.total_seconds()),
        "expires": expiry_time.strftime("%a, %d-%b-%Y %H:%M:%S GMT"),
        "path": refresh_path,
    }

    # Only apply strict security settings in production
    if settings.ENVIRONMENT == "production":
        cookie_kwargs.update({
            "httponly": True,  # Prevent XSS attacks
            "secure": True,     # Only sent over HTTPS
            "samesite": "lax",  # Provides CSRF protection
        })

    response.set_cookie(**cookie_kwargs)

    return {
        "access_token": access_token,
        "expires_in": int(at_expires.total_seconds()),
        "token_type": "bearer",
    }


async def refresh_access_token_service(session, refresh_token: str | None, response):
    """Verify refresh token and issue new access/refresh tokens.

    Prefers rotating the refresh token and resetting the cookie for better security.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )

    try:
        payload = verify_token(refresh_token, token_type="refresh")
        # Denylist check (revoked tokens)
        jti = payload.get("jti")
        if await is_jti_revoked(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is revoked",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )
    except TokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # # Ensure token exists in DB (rotation/invalidation detection)

    # Load user and validate status
    try:
        # user_id may be a string; ensure uuid if needed
        uid = user_id
        try:
            uid = uuid.UUID(user_id)
        except Exception:
            pass
        user = await UserCRUD.get_by_id(session, uid)
    except Exception:
        user = None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not verified"
        )
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive"
        )

    # Reuse existing generator to mint new access/refresh tokens and set cookie
    # Also delete the old refresh token (rotation)
    # Revoke old refresh token jti in denylist until its exp
    try:
        old_exp = payload.get("exp")
        await revoke_token_jti(jti, old_exp)
    except Exception:
        pass
    return await _generate_tokens(user, session, response)
