from datetime import date
from typing import List, Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, Query, status

from app.admin.config import AdminLevel
from app.auth.dependencies import (
    CurrentUser,
    require_any_role,
    require_authentication,
    require_role,
)
from app.auth.schemas import UserRead
from app.database import get_db
from app.office_mgnt import schemas as sch
from app.office_mgnt.services import (
    AvailabilityService,
    OfficeMembershipService,
    OfficeService,
)

router = APIRouter(
    prefix="/offices",
    tags=["offices"],
)


@router.get(
    "/unassigned",
    response_model=List[UserRead],
    summary="Get unassigned users",
    status_code=status.HTTP_200_OK,
)
async def get_unassigned_users(
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.fetch_unassigned_users(db)


# --------------------------------------------------
# office CRUD
# --------------------------------------------------
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=sch.OfficeRead,
    summary="Create a new office",
    description="Create a new office with details such as name and location. Only admins are allowed.",
    responses={
        201: {"description": "Office created successfully"},
        400: {"description": "Invalid data"},
        403: {"description": "Forbidden: Only admins can create offices"},
    },
)
async def create_office(
    payload: sch.OfficeCreate,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeService.create_office(db, payload)


@router.get(
    "/",
    response_model=List[sch.OfficeRead],
    summary="List offices",
    description="Retrieve all offices. Optionally filter by status (`active` or `deactivated`).",
    responses={
        200: {"description": "List of offices returned"},
        403: {"description": "Forbidden: Only admins can list offices"},
    },
)
async def list_offices(
    status_filter: Optional[str] = Query(
        None,
        regex="^(active|deactivated)$",
        description="Filter offices by status (active or deactivated).",
    ),
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    if status_filter is None:
        return await OfficeService.get_all_offices(db)
    return await OfficeService.get_offices_by_status(db, status_filter)


@router.get(
    "/{office_id}",
    response_model=sch.OfficeRead,
    summary="Get office details",
    description="Retrieve details of a specific office by its ID.",
    responses={
        200: {"description": "Office found"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can view office details"},
    },
)
async def read_office(
    office_id: UUID,
    _user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db),
):
    return await OfficeService.get_office(db, office_id)


@router.patch(
    "/{office_id}",
    response_model=sch.OfficeRead,
    summary="Update an office",
    description="Update office information such as name or status. Only admins can update offices.",
    responses={
        200: {"description": "Office updated successfully"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can update offices"},
    },
)
async def update_office(
    office_id: UUID,
    payload: sch.OfficeUpdate,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeService.update_office(db, office_id, payload)


@router.delete(
    "/{office_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an office",
    description="Delete an office by its ID. Only admins are allowed.",
    responses={
        204: {"description": "Office deleted successfully"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can delete offices"},
    },
)
async def delete_office(
    office_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    await OfficeService.delete_office(db, office_id)


@router.post(
    "/{office_id}/deactivate",
    response_model=sch.OfficeRead,
    summary="Deactivate an office",
    description="Deactivate an active office. Only admins are allowed.",
    responses={
        200: {"description": "Office deactivated"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can deactivate offices"},
    },
)
async def deactivate_office(
    office_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeService.deactivate_office(db, office_id)


@router.post(
    "/{office_id}/activate",
    response_model=sch.OfficeRead,
    summary="Activate an office",
    description="Activate a previously deactivated office. Only admins are allowed.",
    responses={
        200: {"description": "Office activated"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can activate offices"},
    },
)
async def activate_office(
    office_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeService.activate_office(db, office_id)


# --------------------------------------------------
# memberships
# --------------------------------------------------
@router.post(
    "/{office_id}/memberships",
    status_code=status.HTTP_201_CREATED,
    response_model=sch.MembershipRead,
    summary="Assign a user to an office",
    description="Add a user as a member of an office. Only admins are allowed.",
    responses={
        201: {"description": "User assigned to office"},
        404: {"description": "Office or user not found"},
        403: {"description": "Forbidden: Only admins can assign users"},
    },
)
async def assign_user_to_office(
    office_id: UUID,
    payload: sch.MembershipCreate,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.assign_user_to_office(
        db, office_id, payload, _admin.id
    )


@router.get(
    "/{office_id}/memberships",
    response_model=List[sch.MembershipRead],
    summary="List office members",
    description="Retrieve all members assigned to a specific office. Only admins are allowed.",
    responses={
        200: {"description": "List of office members"},
        404: {"description": "Office not found"},
        403: {"description": "Forbidden: Only admins can view office members"},
    },
)
async def get_office_members(
    office_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.list_office_members(db, office_id)


@router.get(
    "/{office_id}/hosts",
    response_model=List[sch.MembershipRead],
    summary="List office hosts",
    description="Retrieve all hosts assigned to a specific office. Accessible by any authenticated user.",
    responses={
        200: {"description": "List of office hosts"},
        404: {"description": "Office not found"},
        401: {"description": "Unauthorized"},
    },
)
async def get_office_hosts(
    office_id: UUID,
    _user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.list_office_hosts(db, office_id)


@router.put(
    "/{office_id}/memberships/{membership_id}",
    response_model=sch.MembershipRead,
    summary="Update office membership",
    description="Update membership details (e.g., role). Only admins can perform this action.",
    responses={
        200: {"description": "Membership updated"},
        404: {"description": "Membership not found"},
        403: {"description": "Forbidden: Only admins can update memberships"},
    },
)
async def update_office_membership(
    office_id: UUID,
    membership_id: UUID,
    payload: sch.MembershipUpdate,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.update_office_member(
        db, office_id, membership_id, payload
    )


@router.delete(
    "/{office_id}/memberships/{membership_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from an office",
    description="Remove a user from an office membership. Only admins can perform this action.",
    responses={
        204: {"description": "Membership removed"},
        404: {"description": "Membership not found"},
        403: {"description": "Forbidden: Only admins can remove members"},
    },
)
async def remove_office_member(
    office_id: UUID,
    membership_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    await OfficeMembershipService.remove_office_member(db, office_id, membership_id)


# --------------------------------------------------
# user-centric
# --------------------------------------------------
@router.get(
    "/users/{user_id}/offices",
    response_model=List[sch.MembershipRead],
    summary="List offices of a user",
    description="Retrieve all offices a specific user is assigned to. Only admins can view this.",
    responses={
        200: {"description": "List of user's offices"},
        404: {"description": "User not found"},
        403: {"description": "Forbidden: Only admins can view user offices"},
    },
)
async def get_user_offices(
    user_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.list_user_offices(db, user_id)


# --------------------------------------------------
# availability
# --------------------------------------------------
hostavailableroutes = APIRouter(prefix="/Availability", tags=["hostavailableroutes"])


@hostavailableroutes.post(
    "/hosts/{office_id}/availability",
    response_model=sch.HostAvailabilityRead,
    summary="Set host availability",
    description="Set availability schedule for a host. Accessible by hosts and secretaries.",
    responses={
        200: {"description": "Availability set"},
        404: {"description": "Host not found"},
        403: {"description": "Forbidden: Only hosts/secretaries can set availability"},
    },
)
async def set_host_availability(
    office_id: UUID,  # injected by service layer
    payload: sch.HostAvailabilityCreate,
    _user: CurrentUser = Depends(require_any_role("host", "secretary")),
    db: Database = Depends(get_db),
):
    return await AvailabilityService.set_availability(db, office_id, payload)


@hostavailableroutes.get(
    "/hosts/{office_id}/availability",
    response_model=List[sch.HostAvailabilityRead],
    summary="Get host availability",
    description="Retrieve availability schedule for a host. Accessible by hosts, secretaries, and receptionists.",
    responses={
        200: {"description": "List of availability slots"},
        404: {"description": "Host not found"},
        403: {"description": "Forbidden: Insufficient role permissions"},
    },
)
async def get_host_availability(
    office_id: UUID,
    _user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
    db: Database = Depends(get_db),
):
    return await AvailabilityService.get_availability(db, office_id)


@hostavailableroutes.get("/{office_id}/slots", response_model=List[sch.Slot])
async def get_slots(
    office_id: UUID,
    target_date: date = Query(..., description="Date for which to fetch slots"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    return await AvailabilityService.get_slots_for_date(db, office_id, target_date)


@hostavailableroutes.patch("/{office_id}")
async def edit_host_availability(): ...


@hostavailableroutes.delete("/{office_id}")
async def delete_host_availability(): ...
