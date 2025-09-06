import html
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class OfficeBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Name of the office ",
        examples=["Ministry of Health"],
    )
    description: str = Field(
        default="",
        max_length=1000,
        description="Description of the office",
        examples=["Ministry of Health Headquarters"],
    )
    location: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Location of the office, or office building",
        examples=["HQ Building"],
    )
    is_active: bool = Field(
        default=True, description="Whether the office is active or not"
    )

    # Name validation
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long")
        if not v[0].isalpha():
            raise ValueError("Name must start with a letter")
        # Prevent SQL injection attempts in name
        forbidden_patterns = [
            "--",
            ";",
            "/*",
            "*/",
            "xp_",
            "union",
            "select",
            "drop",
            "insert",
            "delete",
            "update",
        ]
        for pattern in forbidden_patterns:
            if pattern.lower() in v.lower():
                raise ValueError("Invalid characters in office name")
        return v

    # Description validation and sanitization
    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if v is None:
            return ""
        v = v.strip()
        # HTML escape to prevent XSS
        v = html.escape(v)
        # Check for suspicious patterns
        suspicious_patterns = ["<script>", "javascript:", "onerror=", "onload="]
        for pattern in suspicious_patterns:
            if pattern in v.lower():
                raise ValueError("Invalid content in description")
        return v

    # Location validation
    @field_validator("location")
    @classmethod
    def validate_location(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            return None
        # Basic location validation
        if len(v) < 5:
            raise ValueError("Location must be at least 5 characters long if provided")
        # Prevent injection attempts
        forbidden_chars = [";", "--", "/*", "*/"]
        for char in forbidden_chars:
            if char in v:
                raise ValueError("Invalid characters in location")
        return v


class OfficeCreate(OfficeBase):
    pass


class OfficeUpdate(OfficeBase):
    pass


class OfficeRead(OfficeBase):
    id: UUID = Field(..., description="Unique identifier for the office")
    created_at: datetime = Field(description="Date and time of creation")
    updated_at: datetime = Field(description="Date and time of last update")
    is_active: bool = Field(description="Whether the office is active or not")






class MembershipBase(BaseModel):
    user_id: UUID
    position: Optional[str] = None
    is_primary: bool = False


class MembershipCreate(MembershipBase):
    pass


class MembershipUpdate(BaseModel):
    position: Optional[str] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    ended_at: Optional[datetime] = None

class MembershipRead(BaseModel):
    # User info
    user_id: UUID
    first_name: str
    last_name: str
    email: str
    user_active: bool

    # Membership info
    membership_id: UUID
    position: str | None = None
    is_primary: bool
    membership_active: bool
    assigned_at: datetime

