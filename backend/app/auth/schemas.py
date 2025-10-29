"""
Enhanced Pydantic schemas for authentication
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validation import validate_email_domain, validate_password_strength


# User schemas
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr

    @field_validator("email")
    @classmethod
    def validate_email_domain_restriction(cls, v):
        """Validate email domain against allowed domains"""
        return validate_email_domain(str(v))


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength_requirement(cls, v):
        """Validate password strength requirements"""
        return validate_password_strength(v)


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    is_system_user: bool = False
    created_at: datetime
    updated_at: datetime | None = None


class UserUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    is_active: bool | None = None


class UserProfile(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    is_system_user: bool = False
    created_at: datetime
    roles: list[str] = []
    permissions: list[str] = []


# Authentication schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    csrf_token: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    csrf_token: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v):
        """Validate new password strength requirements"""
        return validate_password_strength(v)


class PasswordResetRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def validate_email_domain_restriction(cls, v):
        """Validate email domain against allowed domains"""
        return validate_email_domain(str(v))


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v):
        """Validate new password strength requirements"""
        return validate_password_strength(v)


class EmailVerificationRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def validate_email_domain_restriction(cls, v):
        """Validate email domain against allowed domains"""
        return validate_email_domain(str(v))


class VerifyUserRequest(BaseModel):
    token: str


# Token schemas
class UserTokenBase(BaseModel):
    access_key: str | None = None
    refresh_key: str | None = None
    expires_at: datetime


class UserTokenCreate(UserTokenBase):
    user_id: uuid.UUID


class UserTokenRead(UserTokenBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


# Generic message response schema used by auth endpoints
class MessageResponse(BaseModel):
    message: str
