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
    change_password_service,
    create_user_service,
    get_current_user_profile_service,
    logout_user_service,
    refresh_access_token_service,
    request_password_reset_service,
    resend_verification_email_service,
    reset_password_service,
    set_password_first_time_service,
    user_authenticate_service,
)
from app.auth.user_emails import send_account_invite_email
from app.core.middleware.error_handling import (
    AuthenticationError,
    BusinessLogicError,
    ResourceNotFoundError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_email_verification_token,
    verify_email_verification_token,
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
    session: Database = Depends(get_db),
):
    """Refresh access token using the refresh token.

    Reads the refresh token primarily from the httpOnly cookie, falling back to the JSON body when provided.
    Rotates the refresh token and resets the cookie for security.
    """
    cookie_token = request.cookies.get("refresh_token")
    token = cookie_token
    return await refresh_access_token_service(session, token, response)


@router.post("/logout", status_code=status.HTTP_200_OK, response_model=MessageResponse)
async def logout_user(
    response: Response,
    request: Request,
    current_user: CurrentUser = Depends(require_authentication),
    session: Database = Depends(get_db),
):
    """Logout user and invalidate tokens via service layer"""
    await logout_user_service(session, request, response, current_user)
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
    data = await get_current_user_profile_service(session, current_user)
    return UserProfile(**data)


@router.post(
    "/change-password", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
async def change_password(
    request: PasswordChangeRequest,
    current_user: CurrentUser = Depends(require_authentication),
    session: Database = Depends(get_db),
):
    """Change user password"""
    await change_password_service(session, current_user, request)
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
    await request_password_reset_service(session, request, background_tasks)
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
    await reset_password_service(session, request)
    return MessageResponse(message="Password reset successfully")


@router.post(
    "/set-password", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
async def set_password_first_time(
    request: PasswordResetConfirm, session: Database = Depends(get_db)
):
    """Set password using invitation/reset token (first login flow)."""
    await set_password_first_time_service(session, request)
    return MessageResponse(message="Password set successfully")


# @router.post(
#     "/resend-verification",
#     status_code=status.HTTP_200_OK,
#     response_model=MessageResponse,
# )
# async def resend_verification_email(
#     request: EmailVerificationRequest,
#     background_tasks: BackgroundTasks,
#     session: Database = Depends(get_db),
# ):
#     """Resend email verification"""
#     await resend_verification_email_service(session, request, background_tasks)
#     # Always respond generically
#     return MessageResponse(
#         message="If the email exists, a verification link has been sent"
#     )
