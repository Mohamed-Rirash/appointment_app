import html
from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, validator

from app.office_mgnt.utils import Daysofweek


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


import html
from datetime import date, datetime, time
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, validator

from app.office_mgnt.utils import Daysofweek


class OfficeBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Name of the office",
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
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None


class OfficeRead(OfficeBase):
    id: UUID = Field(..., description="Unique identifier for the office")
    created_at: datetime = Field(description="Date and time of creation")
    updated_at: datetime = Field(description="Date and time of last update")
    is_active: bool = Field(description="Whether the office is active or not")


class MembershipBase(BaseModel):
    user_id: UUID = Field(..., description="ID of the user to assign to office")
    position: Optional[str] = Field(None, max_length=100, description="Position/role in the office")
    is_primary: bool = Field(False, description="Whether this user is the primary contact")


class MembershipCreate(MembershipBase):
    pass


class MembershipUpdate(BaseModel):
    position: Optional[str] = Field(None, max_length=100)
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


class OfficeMemberDetailRead(BaseModel):
    user_id: UUID
    first_name: str
    last_name: str
    email: str
    user_active: bool
    membership_id: UUID
    office_id: UUID
    position: str | None
    is_primary: bool
    membership_active: bool
    assigned_at: datetime | None
    ended_at: datetime | None
    office_name: str
    office_location: str

    class Config:
        # allow SQLAlchemy row objects to be dumped directly
        from_attributes = True


class HostAvailabilityCreate(BaseModel):
    daysofweek: Optional[Daysofweek] = None
    specific_date: Optional[date] = None
    start_time: time
    end_time: time
    is_recurring: bool = True

    @field_validator("specific_date")
    def validate_either_date_or_day(cls, v, values):
        if not v and not values.get("daysofweek"):
            raise ValueError("Either daysofweek or specific_date must be provided")
        return v


class HostAvailabilityRead(BaseModel):
    id: UUID
    daysofweek: Optional[Daysofweek]
    specific_date: Optional[date]
    start_time: time
    end_time: time
    is_recurring: bool


class HostAssignmentBase(BaseModel):
    host_id: UUID = Field(..., description="ID of the host user")
    office_id: UUID = Field(..., description="ID of the office")
    is_primary: bool = Field(False, description="Whether this host is the primary host for the office")


class HostAssignmentCreate(HostAssignmentBase):
    pass


class HostAssignmentUpdate(BaseModel):
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


class HostAssignmentRead(BaseModel):
    host_id: UUID
    office_id: UUID
    host_name: str
    host_email: str
    office_name: str
    is_primary: bool
    assigned_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# --- Slots (generated, not stored) ---
class Slot(BaseModel):
    date: date
    slot_start: time
    slot_end: time
    is_booked: bool = False


# Enhanced schemas for admin operations
class OfficeWithMembersRead(OfficeRead):
    total_members: int = Field(0, description="Total number of active members")
    active_members: int = Field(0, description="Number of active members")
    primary_contact: Optional[dict] = Field(None, description="Primary contact information")
    hosts: List[HostAssignmentRead] = Field(default_factory=list, description="List of hosts assigned to this office")


class UserHostStatus(BaseModel):
    user_id: UUID
    is_host: bool
    assigned_offices: List[HostAssignmentRead] = Field(default_factory=list)
    available_offices: List[OfficeRead] = Field(default_factory=list)


class BulkHostAssignment(BaseModel):
    assignments: List[HostAssignmentCreate] = Field(..., min_items=1, max_items=50)
    assigned_by: UUID = Field(..., description="ID of the admin making the assignment")


class OfficeStats(BaseModel):
    office_id: UUID
    office_name: str
    total_members: int
    active_members: int
    total_hosts: int
    active_hosts: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int


# Search schemas
class HostSearchResult(BaseModel):
    """Result for host search"""
    user_id: UUID
    first_name: str
    last_name: str
    email: str
    office_id: UUID
    office_name: str
    office_location: str
    position: str | None = None
    is_primary: bool = False


class OfficeSearchResult(BaseModel):
    """Result for office search with hosts"""
    office_id: UUID
    office_name: str
    office_location: str
    office_description: str | None = None
    hosts: List[HostSearchResult] = []
