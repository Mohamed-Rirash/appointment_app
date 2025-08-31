from typing import List
from uuid import UUID

from databases import Database
from fastapi import APIRouter, Depends, status

from app.database import get_db
from app.office_mgnt.schemas import OfficeCreate, OfficeRead, OfficeUpdate
from app.office_mgnt.services import OfficeService

router = APIRouter(
    prefix="/offices",
    tags=["Offices"],
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
async def read_offices(db: Database = Depends(get_db)) -> List[OfficeRead]:
    """
    Get all offices
    """
    return await OfficeService.get_all_offices(db)


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


@router.get("/active/", response_model=List[OfficeRead])
async def read_active_offices(db: Database = Depends(get_db)) -> List[OfficeRead]:
    """
    Get all active offices
    """
    return await OfficeService.get_active_offices(db)


@router.patch("/{office_id}/deactivate", response_model=OfficeRead)
async def deactivate_office(
    office_id: UUID, db: Database = Depends(get_db)
) -> OfficeRead:
    """
    Deactivate an office (soft delete)
    """
    return await OfficeService.deactivate_office(db, office_id)
