from typing import List, Optional
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_db
from app.office_mgnt.schemas import OfficeCreate, OfficeRead, OfficeUpdate
from app.office_mgnt.services import OfficeService

router = APIRouter(
    prefix="/offices",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=OfficeRead)
async def create_office(
    office_data: OfficeCreate, db: Database = Depends(get_db)
) -> OfficeRead:
    """
    Create a new office
    """
    return await OfficeService.create_office(db, office_data)


@router.get("/", response_model=List[OfficeRead])
async def list_offices(
    db: Database = Depends(get_db),
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
    office_id: UUID, office_data: OfficeUpdate, db: Database = Depends(get_db)
) -> OfficeRead:
    """
    Update an existing office
    """
    return await OfficeService.update_office(db, office_id, office_data)


@router.delete("/{office_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_office(office_id: UUID, db: Database = Depends(get_db)) -> None:
    """
    Delete an office
    """
    await OfficeService.delete_office(db, office_id)
    return None


@router.patch("/{office_id}/deactivate", response_model=OfficeRead)
async def deactivate_office(
    office_id: UUID, db: Database = Depends(get_db)
) -> OfficeRead:
    """
    Deactivate an office (soft delete)
    """
    return await OfficeService.deactivate_office(db, office_id)
