# Router for authentication endpoints

from typing import Annotated

from databases import Database
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from starlette.responses import JSONResponse

from app.auth.crud import UserCRUD
from app.auth.dependencies import CurrentUser, require_authentication
from app.auth.rbac import RBACCRUD, RoleCRUD
from app.auth.schemas import (
    EmailVerificationRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserCreate,
    UserProfile,
    UserRead,
    VerifyUserRequest,
)
from app.auth.service import (
    activate_user_account,
    create_user_service,
    user_authenticate_service,
    refresh_access_token_service,
)
from app.auth.user_emails import (
    send_account_verification_email,
    send_password_reset_email,
    send_account_invite_email,
)
from app.core.middleware.error_handling import (
    AuthenticationError,
    BusinessLogicError,
    ResourceNotFoundError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_email_verification_token,
    generate_password_reset_token,
    verify_email_verification_token,
    verify_password_reset_token,
)
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


# @router.post("/", status_code=status.HTTP_201_CREATED)
# async def create_user(
#     session: Annotated[Database, Depends(get_db)],
#     background_tasks: BackgroundTasks,
#     user: UserCreate,
# ):
#     result = await create_user_service(session, user)
#     # after creating user, send verification email
#     await send_account_verification_email(result, background_tasks)
#     return {"message": "User created successfully"}


# @router.post("/verify", status_code=status.HTTP_200_OK)
# async def verify_user_account(
#     data: VerifyUserRequest,
#     background_tasks: BackgroundTasks,
#     session: Database = Depends(get_db),
# ):
#     await activate_user_account(data, session, background_tasks)
#     return JSONResponse({"message": "Account is activated successfully."})


@router.post("/login", status_code=status.HTTP_200_OK, response_model=LoginResponse)
async def login_user(
    response: Response,
    data: OAuth2PasswordRequestForm = Depends(),
    session: Database = Depends(get_db),
):
    return await user_authenticate_service(session, data, response)


@router.post(
    "/refresh", status_code=status.HTTP_200_OK, response_model=RefreshTokenResponse
)
async def refresh_token(
    response: Response,
    request: Request,
    payload: RefreshTokenRequest | None = None,
    session: Database = Depends(get_db),
):
    """Refresh access token using the refresh token.

    Reads the refresh token primarily from the httpOnly cookie, falling back to the JSON body when provided.
    Rotates the refresh token and resets the cookie for security.
    """
    cookie_token = request.cookies.get("refresh_token")
    body_token = getattr(payload, "refresh_token", None) if payload else None
    token = cookie_token or body_token
    return await refresh_access_token_service(session, token, response)


@router.post("/logout", status_code=status.HTTP_200_OK, response_model=MessageResponse)
async def logout_user(
    response: Response,
    current_user: CurrentUser = Depends(require_authentication),
    session: Database = Depends(get_db),
):
    """Logout user and invalidate tokens"""
    # Clear refresh token cookie
    response.delete_cookie("refresh_token")

    # In a real implementation, you'd also invalidate the tokens in the database
    return MessageResponse(message="Successfully logged out")


# @router.get("/debug-auth")
# async def debug_auth(
#     credentials = Depends(require_authentication)
# ):
#     """Debug authentication"""
#     return {
#         "message": "Authentication working",
#         "user": credentials.email,
#         "note": "If this works, your Bearer token is being accepted."
#     }


@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserProfile)
async def get_current_user_profile(
    session: Database = Depends(get_db),
    current_user: CurrentUser = Depends(require_authentication),
):
    """Get current user profile with roles and permissions as lists of strings"""
    from sqlalchemy import select, and_
    from app.auth.models import user_roles, roles, role_permissions, permissions

    # Fetch role names for the current user (may be multiple)
    roles_query = (
        select(roles.c.name)
        .select_from(user_roles.join(roles, roles.c.id == user_roles.c.role_id))
        .where(
            and_(
                user_roles.c.user_id == current_user.id,
                user_roles.c.is_active == True,
            )
        )
        .order_by(roles.c.name)
    )
    role_rows = await session.fetch_all(roles_query)
    role_names = [r["name"] for r in role_rows]

    # Fetch permissions for these roles as "resource:action" strings
    perm_names: list[str] = []
    if role_names:
        # Get role ids first
        role_ids_query = (
            select(roles.c.id)
            .select_from(user_roles.join(roles, roles.c.id == user_roles.c.role_id))
            .where(
                and_(
                    user_roles.c.user_id == current_user.id,
                    user_roles.c.is_active == True,
                )
            )
        )
        role_id_rows = await session.fetch_all(role_ids_query)
        role_ids = [row["id"] for row in role_id_rows]

        if role_ids:
            perms_query = (
                select(permissions.c.resource, permissions.c.action)
                .select_from(
                    role_permissions.join(
                        permissions,
                        permissions.c.id == role_permissions.c.permission_id,
                    )
                )
                .where(
                    and_(
                        role_permissions.c.role_id.in_(role_ids),
                        permissions.c.is_active == True,
                    )
                )
                .order_by(permissions.c.resource, permissions.c.action)
            )
            perm_rows = await session.fetch_all(perms_query)
            perm_names = list(
                {f"{p['resource']}:{p['action']}" for p in perm_rows}
            )

    return UserProfile(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        roles=role_names,
        permissions=perm_names,
    )


@router.post(
    "/change-password", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
async def change_password(
    request: PasswordChangeRequest,
    current_user: CurrentUser = Depends(require_authentication),
    session: Database = Depends(get_db),
):
    """Change user password"""
    # Verify current password
    user = await UserCRUD.get_by_id(session, current_user.id)
    if not user:
        raise ResourceNotFoundError("User")

    from app.auth.security import hash_password, verify_password

    if not await verify_password(user["password"], request.current_password):
        raise AuthenticationError("Current password is incorrect")

    # Hash new password and update
    new_password_hash = await hash_password(request.new_password)
    await UserCRUD.update(session, current_user.id, {"password": new_password_hash})

    return MessageResponse(message="Password changed successfully")


@router.post(
    "/request-password-reset",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    session: Database = Depends(get_db),
):
    """Request password reset"""
    user = await UserCRUD.get_by_email(session, request.email)
    if not user:
        # Don't reveal if email exists or not
        return MessageResponse(
            message="If the email exists, a password reset link has been sent"
        )

    # Generate password reset token
    reset_token = generate_password_reset_token(user["id"])

    # Send password reset email
    await send_password_reset_email(user, reset_token, background_tasks)

    return MessageResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post(
    "/reset-password", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
async def reset_password(
    request: PasswordResetConfirm, session: Database = Depends(get_db)
):
    """Reset password using token"""
    # Verify reset token
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise AuthenticationError("Invalid or expired reset token")

    # Hash new password and update
    from app.auth.security import hash_password

    new_password_hash = await hash_password(request.new_password)

    # Also verify and activate the user on first successful password set
    result = await UserCRUD.update(
        session,
        user_id,
        {"password": new_password_hash, "is_verified": True, "is_active": True},
    )
    if not result:
        raise ResourceNotFoundError("User")

    return MessageResponse(message="Password reset successfully")


@router.post(
    "/set-password", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
async def set_password_first_time(
    request: PasswordResetConfirm, session: Database = Depends(get_db)
):
    """Set password using invitation/reset token (first login flow)."""
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise AuthenticationError("Invalid or expired token")

    from app.auth.security import hash_password

    new_password_hash = await hash_password(request.new_password)

    result = await UserCRUD.update(
        session,
        user_id,
        {"password": new_password_hash, "is_verified": True, "is_active": True},
    )
    if not result:
        raise ResourceNotFoundError("User")

    return MessageResponse(message="Password set successfully")


@router.post(
    "/resend-verification",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
async def resend_verification_email(
    request: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    session: Database = Depends(get_db),
):
    """Resend email verification"""
    user = await UserCRUD.get_by_email(session, request.email)
    if not user:
        # Don't reveal if email exists or not
        return MessageResponse(
            message="If the email exists, a verification link has been sent"
        )

    if user["is_verified"]:
        return MessageResponse(message="Email is already verified")

    # Send verification email
    await send_account_verification_email(user, background_tasks)

    return MessageResponse(
        message="If the email exists, a verification link has been sent"
    )
