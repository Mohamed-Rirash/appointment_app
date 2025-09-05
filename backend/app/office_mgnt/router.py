from typing import List, Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.admin.config import AdminLevel
from app.auth.dependencies import CurrentUser, RequireAdminRole, require_role
from app.database import get_db
from app.office_mgnt.schemas import (
    MembershipCreate,
    MembershipRead,
    MembershipUpdate,
    OfficeCreate,
    OfficeRead,
    OfficeUpdate,
)
from app.office_mgnt.services import OfficeMembershipService, OfficeService

router = APIRouter(
    prefix="/offices",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=OfficeRead)
async def create_office(
    office_data: OfficeCreate,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
) -> OfficeRead:
    """
    Create a new office
    """

    return await OfficeService.create_office(db, office_data)


@router.get("/", response_model=List[OfficeRead])
async def list_offices(
    db: Database = Depends(get_db),
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    status: Optional[str] = Query(
        None,
        description="Filter by status: 'active', 'deactivated'. Omit for all.",
        example="active",
    ),
) -> List[OfficeRead]:
    """
    Retrieve all offices, optionally filtered by status.
    """
    if status is None:
        return await OfficeService.get_all_offices(db)
    elif status == "active" or status == "deactivated":
        return await OfficeService.get_offices_by_status(db, status)
    else:
        # Optional: return 400 for invalid status
        raise HTTPException(
            status_code=400,
            detail="Invalid status filter. Use 'active' or 'deactivated'.",
        )


@router.get("/{office_id}", response_model=OfficeRead)
async def read_office(office_id: UUID, db: Database = Depends(get_db)) -> OfficeRead:
    """
    Get a specific office by ID
    """
    return await OfficeService.get_office(db, office_id)


@router.patch("/{office_id}", response_model=OfficeRead)
async def update_office(
    office_id: UUID,
    office_data: OfficeUpdate,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
) -> OfficeRead:
    """
    Update an existing office
    """
    return await OfficeService.update_office(db, office_id, office_data)


@router.delete("/{office_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_office(
    office_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
) -> None:
    """
    Delete an office
    """
    await OfficeService.delete_office(db, office_id)
    return None


@router.patch("/{office_id}/deactivate", response_model=OfficeRead)
async def deactivate_office(
    office_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
) -> OfficeRead:
    """
    Deactivate an office (soft delete)
    """
    return await OfficeService.deactivate_office(db, office_id)


# WARNING: this is not implemented yet
@router.patch("/{office_id}/activate", response_model=OfficeRead)
async def activate_office(
    office_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
) -> OfficeRead:
    """
    Deactivate an office (soft delete)
    """
    return await OfficeService.deactivate_office(db, office_id)


# ============================membership=================================================
@router.post(
    "/{office_id}/memberships",
    response_model=MembershipRead,
    status_code=status.HTTP_201_CREATED,
)
async def assign_user_to_office(
    office_id: UUID,
    membership: MembershipCreate,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.assign_user_to_office(
        db, office_id, membership
    )


@router.get("/{office_id}/memberships", response_model=List[MembershipRead])
async def get_office_members(
    office_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.list_office_members(db, office_id)


@router.get("/{office_id}/memberships/{membership_id}", response_model=MembershipRead)
async def get_office_member(
    office_id: UUID,
    membership_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.get_office_member(db, office_id, membership_id)


@router.put("/{office_id}/memberships/{membership_id}", response_model=MembershipRead)
async def update_office_membership(
    office_id: UUID,
    membership_id: UUID,
    membership_data: MembershipUpdate,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.update_office_member(
        db, office_id, membership_id, membership_data
    )


@router.delete(
    "/{office_id}/memberships/{membership_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_office_member(
    office_id: UUID,
    membership_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.remove_office_member(
        db, office_id, membership_id
    )


@router.get("/users/{user_id}/offices", response_model=List[MembershipRead])
async def get_user_offices(
    user_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.list_user_offices(db, user_id)


@router.get("/memberships/search", response_model=List[MembershipRead])
async def search_memberships(
    name: str | None = None,
    position: str | None = None,
    office_id: UUID | None = None,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.search_office_members(
        db, name, position, office_id
    )


@router.get("/{office_id}/primary", response_model=MembershipRead)
async def get_primary_contact(
    office_id: UUID,
    admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await OfficeMembershipService.get_office_primary_contact(db, office_id)
