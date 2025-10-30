from datetime import date
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
    HostAssignmentService,
    OfficeMembershipService,
    OfficeSearchService,
    OfficeService,
    OfficeStatsService,
)

router = APIRouter(
    prefix="/offices",
    tags=["offices"],
)


@router.get(
    "/unassigned",
    response_model=list[UserRead],
    summary="Get users that are not assigned to an office (only admins)",
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
    summary="Register a new office",
    description="Create a new office with details such as name and location. Only admins are allowed.(only admins)",
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
    response_model=list[sch.OfficeRead],
    summary="get all the offices we have registered (only admins)",
    description="Retrieve all offices. Optionally filter by status (`active` or `deactivated`).",
    responses={
        200: {"description": "List of offices returned"},
        403: {"description": "Forbidden: Only admins can list offices"},
    },
)
async def list_offices(
    status_filter: str | None = Query(
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
    summary="Get single office details (only admins)",
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
    summary="Update an office details (only admins)",
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
    summary="Delete an office and all its members (only admins) RISK",
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
    summary="Deactivate an office (only admins)",
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
    summary="Activate an office (only admins)",
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
    summary="Assign a user to an office (only admins)",
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
    response_model=list[sch.MembershipRead],
    summary="get all members assigned to an office (only admins)",
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
    response_model=list[sch.MembershipRead],
    summary="get all host members in this office (hosts, secretaries, receptions)",
    description="we excluded secretaries of the office to book appointments we only have a meeting host person eg agaasimaha",
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


@router.patch(
    "/{office_id}/memberships/{user_id}",
    response_model=sch.MembershipRead,
    summary="Update/edit office membershiping (only admins)",
    description="Update membership details (e.g., role). Only admins can perform this action.",
    responses={
        200: {"description": "Membership updated"},
        404: {"description": "Membership not found"},
        403: {"description": "Forbidden: Only admins can update memberships"},
    },
)
async def update_office_membership(
    office_id: UUID,
    user_id: UUID,
    payload: sch.MembershipUpdate,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.update_office_member(
        db, office_id, user_id, payload
    )


@router.delete(
    "/{office_id}/memberships/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a member from an office (only admins can perform this action)",
    description="Remove a user from an office membership. Only admins can perform this action.",
    responses={
        204: {"description": "Membership removed"},
        404: {"description": "Membership not found"},
        403: {"description": "Forbidden: Only admins can remove members"},
    },
)
async def remove_office_member(
    office_id: UUID,
    user_id: UUID,
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    await OfficeMembershipService.remove_office_member(db, office_id, user_id)


# --------------------------------------------------
# user-centric
# --------------------------------------------------
@router.get(
    "/users/{user_id}/offices",
    response_model=list[sch.MembershipRead],
    summary="get users office by using user_id (only admin)",
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


# =============================================================================
# HOST ASSIGNMENT ENDPOINTS
# =============================================================================


@router.post(
    "/hosts/assign",
    response_model=sch.HostAssignmentRead,
    summary="Assign a host to an office",
    deprecated=True,
    description="we do not need this anymore",
    status_code=status.HTTP_201_CREATED,
)
async def assign_host_to_office(
    payload: sch.HostAssignmentCreate,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
):
    """Assign a host to an office"""
    return await HostAssignmentService.assign_host_to_office(db, payload, admin.id)


@router.post(
    "/hosts/bulk-assign",
    response_model=list[sch.HostAssignmentRead],
    deprecated=True,
    summary="Bulk assign multiple hosts to offices",
)
async def bulk_assign_hosts(
    payload: sch.BulkHostAssignment,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
):
    """Bulk assign multiple hosts to offices"""
    return await HostAssignmentService.bulk_assign_hosts(
        db, payload.assignments, payload.assigned_by
    )


@router.get(
    "/hosts",
    response_model=list[sch.HostAssignmentRead],
    summary="List host assignments",
    deprecated=True,
    description="List host assignments with optional filtering by office or host",
)
async def list_host_assignments(
    office_id: UUID | None = Query(None),
    host_id: UUID | None = Query(None),
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
):
    """List host assignments with optional filtering"""
    return await HostAssignmentService.get_host_assignments(
        db, office_id=office_id, host_id=host_id
    )


# @router.put(
#     "/hosts/{host_id}/office/{office_id}",
#     response_model=sch.HostAssignmentRead,
#     summary="Update host assignment",
# )
# async def update_host_assignment(
#     host_id: UUID,
#     office_id: UUID,
#     payload: sch.HostAssignmentUpdate,
#     db: Database = Depends(get_db),
#     admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
# ):
#     """Update host assignment (primary status, active status)"""
#     return await HostAssignmentService.update_host_assignment(
#         db, host_id, office_id, payload
#     )


# @router.delete(
#     "/hosts/{host_id}/office/{office_id}",
#     status_code=status.HTTP_204_NO_CONTENT,
#     summary="Remove host from office",
# )
# async def remove_host_from_office(
#     host_id: UUID,
#     office_id: UUID,
#     db: Database = Depends(get_db),
#     admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
# ):
#     """Remove host from office"""
#     await HostAssignmentService.remove_host_from_office(db, host_id, office_id)


# =============================================================================
# STATISTICS AND REPORTS
# =============================================================================


@router.get(
    "/stats/all",
    response_model=list[sch.OfficeStats],
    summary="Get all office statistics",
    description="get all office statistics we use it in the dashboard",
)
async def get_all_office_stats(
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
):
    """Get statistics for all offices"""
    return await OfficeStatsService.get_all_office_stats(db)


@router.get(
    "/{office_id}/stats",
    response_model=sch.OfficeStats,
    summary="Get office statistics",
    description="Get comprehensive statistics for an office",
)
async def get_office_stats(
    office_id: UUID,
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
):
    """Get comprehensive statistics for an office"""
    return await OfficeStatsService.get_office_stats(db, office_id)


# =============================================================================
# SEARCH ENDPOINTS
# =============================================================================


@router.get(
    "/search",
    response_model=list[sch.OfficeRead],
    summary="Search offices by name",
    description="Search for offices by name or description",
)
async def search_offices(
    query: str = Query(..., min_length=1, description="Search query for office name"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """
    Search for offices by name or description.
    Returns matching offices.
    """
    return await OfficeSearchService.search_offices_by_name_or_description(db, query)


@router.get(
    "/search/hosts",
    response_model=list[sch.HostSearchResult],
    summary="Search hosts by name",
    description="Search for hosts by their name and get their office and position information",
)
async def search_hosts_by_name(
    search: str = Query(..., min_length=2, description="Host name to search for"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """
    Search for hosts by name (e.g., 'Mohamed Ismail').
    Returns host information including their office and position.
    """
    return await OfficeSearchService.search_by_host_name(db, search)


@router.get(
    "/search/by-office",
    response_model=list[sch.OfficeSearchResult],
    summary="Search offices and get all hosts",
    description="Search for offices by name and get all hosts/positions in those offices",
)
async def search_offices_with_hosts(
    search: str = Query(..., min_length=2, description="Office name to search for"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """
    Search for offices by name (e.g., 'Ministry of Health').
    Returns office information with all hosts and their positions.
    """
    return await OfficeSearchService.search_by_office_name(db, search)


@router.get(
    "/search/by-position",
    response_model=list[sch.HostSearchResult],
    summary="Search hosts by position",
    description="Search for hosts by their position/title",
)
async def search_hosts_by_position(
    position: str = Query(
        ..., min_length=2, description="Position/title to search for"
    ),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """
    Search for hosts by position (e.g., 'Minister', 'Director').
    Returns host information including their office.
    """
    return await OfficeSearchService.search_by_position(db, position)


# =============================================================================
# USER HOST STATUS ENDPOINTS
# =============================================================================


# @router.get(
#     "/users/{user_id}/host-status",
#     response_model=sch.UserHostStatus,
#     summary="Get user's host status",
#     description="Get user's host status and available offices",
# )
# async def get_user_host_status(
#     user_id: UUID,
#     db: Database = Depends(get_db),
#     admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
# ):
#     """Get user's host status and available offices"""
#     # Get user's current host assignments
#     assignments = await HostAssignmentService.get_host_assignments(db, host_id=user_id)

#     # Get all active offices for reference
#     offices = await EnhancedOfficeService.get_all_offices(db)
#     active_offices = [o for o in offices if o.is_active]

#     # Filter out offices where user is already assigned
#     assigned_office_ids = {a.office_id for a in assignments}
#     available_offices = [o for o in active_offices if o.id not in assigned_office_ids]

#     return sch.UserHostStatus(
#         user_id=user_id,
#         is_host=len(assignments) > 0,
#         assigned_offices=assignments,
#         available_offices=available_offices,
#     )


# --------------------------------------------------
# availability
hostavailableroutes = APIRouter(prefix="/availability", tags=["Host Availability"])


@hostavailableroutes.post(
    "/hosts/{office_id}",
    response_model=sch.HostAvailabilityRead,
    summary="Set host availability",
    description="Define availability for a host. Supports recurring or one-time availability.",
)
async def set_host_availability(
    office_id: UUID,
    payload: sch.HostAvailabilityCreate,
    _user: CurrentUser = Depends(require_any_role("host", "secretary")),
    db: Database = Depends(get_db),
):
    return await AvailabilityService.set_availability(db, _user.id, office_id, payload)


@hostavailableroutes.get(
    "/hosts/{office_id}",
    response_model=list[sch.HostAvailabilityRead],
    summary="Get host availability",
    description="Retrieve availability schedule for a host (recurring + one-time).",
)
async def get_host_availability(
    office_id: UUID,
    _user: CurrentUser = Depends(require_any_role("host", "secretary", "reception")),
    db: Database = Depends(get_db),
):
    return await AvailabilityService.get_availability(db, office_id)


@hostavailableroutes.get(
    "/hosts/{office_id}/slots",
    response_model=list[sch.Slot],
    summary="Get all slots for a date",
    description="Get all generated 15-min slots for a given date (both booked and available).",
)
async def get_slots(
    office_id: UUID,
    target_date: date = Query(..., description="Date to fetch slots for"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """Get all time slots for a specific date"""
    return await AvailabilityService.get_slots_for_date(db, office_id, target_date)


@hostavailableroutes.get(
    "/hosts/{office_id}/slots/available",
    response_model=list[sch.Slot],
    summary="Get available (unbooked) slots",
    description="Get only available (unbooked) 15-min slots for a given date.",
)
async def get_available_slots(
    office_id: UUID,
    target_date: date = Query(..., description="Date to fetch available slots for"),
    db: Database = Depends(get_db),
    _user: CurrentUser = Depends(require_authentication),
):
    """Get only available (unbooked) time slots for a specific date"""
    return await AvailabilityService.get_available_slots_for_date(
        db, office_id, target_date
    )
