# Service layer for authentication logic

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import update

from app.auth.config import get_auth_settings
from app.auth.constants import USER_VERIFY_ACCOUNT
from app.auth.crud import UserCRUD, UserTokenCRUD
from app.auth.models import users
from app.auth.security import hash_password, str_encode, verify_password
from app.auth.user_emails import send_account_activation_confirmation_email
from app.auth.utils import get_context_string, unique_string
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    TokenError,
    is_jti_revoked,
    revoke_token_jti,
)

settings = get_auth_settings()


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
    # update user
    query = (
        update(users)
        .where(users.c.id == user["id"])
        .values(is_active=True, verified_at=datetime.now(), is_verified=True)
    )
    await session.execute(query)
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
            detail="your acount has not been verified please check your email to verify your account",
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="your acount has been deactivated please contact the admin",
        )

    return await _generate_tokens(user, session, response)


async def _generate_tokens(user, session, response):
    # Use the new token system for consistency
    at_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    rt_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    # Create tokens using the new system
    access_token = create_access_token(subject=user["id"], expires_delta=at_expires)

    refresh_token = create_refresh_token(subject=user["id"], expires_delta=rt_expires)

    # Persist/rotate refresh token in DB (single active token per user)
    try:
        await UserTokenCRUD.delete_by_user(session, user["id"])  # revoke old tokens
    except Exception:
        pass
    expiry_time = datetime.now(timezone.utc) + rt_expires
    try:
        await UserTokenCRUD.create(
            session,
            {
                "user_id": user["id"],
                "access_key": None,
                "refresh_key": refresh_token,
                "expires_at": expiry_time,
            },
        )
    except Exception:
        # If DB write fails, still proceed but rotation detection won't work
        pass

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=rt_expires.total_seconds(),
        expires=expiry_time.strftime("%a, %d-%b-%Y %H:%M:%S GMT"),
        samesite=None,
        secure=not settings.DEBUG,
    )

    return {
        "access_token": access_token,
        "expires_in": int(at_expires.total_seconds()),
        "token_type": "bearer",
    }


async def refresh_access_token_service(session, refresh_token: str, response):
    """Verify refresh token and issue new access/refresh tokens.

    Prefers rotating the refresh token and resetting the cookie for better security.
    """
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    try:
        payload = verify_token(refresh_token, token_type="refresh")
        # Denylist check (revoked tokens)
        jti = payload.get("jti")
        if await is_jti_revoked(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is revoked")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except TokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    # Ensure token exists in DB (rotation/invalidation detection)
    token_row = await UserTokenCRUD.get_by_refresh(session, refresh_token)
    if not token_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is not valid anymore")

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not verified")
    if not user.get("is_active"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")

    # Reuse existing generator to mint new access/refresh tokens and set cookie
    # Also delete the old refresh token (rotation)
    try:
        await UserTokenCRUD.delete_by_refresh(session, refresh_token)
    except Exception:
        pass
    # Revoke old refresh token jti in denylist until its exp
    try:
        old_exp = payload.get("exp")
        await revoke_token_jti(jti, old_exp)
    except Exception:
        pass
    return await _generate_tokens(user, session, response)
