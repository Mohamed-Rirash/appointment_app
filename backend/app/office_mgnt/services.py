from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.office_mgnt.crud import OfficeMgmtCRUD
from app.office_mgnt.schemas import OfficeCreate, OfficeRead, OfficeUpdate


class OfficeService:
    @staticmethod
    async def create_office(session, office_data: OfficeCreate) -> OfficeRead:
        """
        Create a new office after validating business rules
        """
        # Check if office already exists by name
        existing_office = await OfficeMgmtCRUD.get_by_name(
            session=session, office_name=office_data.name
        )
        if existing_office:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Office with this name already exists",
            )

        # Optional: Check for duplicate location if needed
        if office_data.location:
            existing_location = await OfficeMgmtCRUD.get_by_location(
                session=session, location=office_data.location
            )
            if existing_location:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Another office already exists at this location",
                )

        # Create office
        office_dict = office_data.model_dump()
        created_office = await OfficeMgmtCRUD.create(session, office_dict)

        if not created_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create office due to server error",
            )

        return OfficeRead(**created_office)

    @staticmethod
    async def get_office(session, office_id: UUID) -> OfficeRead:
        """
        Get a single office by ID
        """
        office = await OfficeMgmtCRUD.get_by_id(session, office_id)

        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        return OfficeRead(**office)

    @staticmethod
    async def update_office(
        session, office_id: UUID, office_data: OfficeUpdate
    ) -> OfficeRead:
        """
        Update an existing office
        """
        # Check if office exists
        existing_office = await OfficeMgmtCRUD.get_by_id(session, office_id)
        if not existing_office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Check for name conflict (if name is being changed)
        if office_data.name != existing_office.get("name"):
            office_with_same_name = await OfficeMgmtCRUD.get_by_name(
                session=session, office_name=office_data.name
            )
            if office_with_same_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Another office already exists with this name",
                )

        # Update office
        office_dict = office_data.model_dump(exclude_unset=True)
        updated_office = await OfficeMgmtCRUD.update(session, office_id, office_dict)

        if not updated_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update office",
            )

        return OfficeRead(**updated_office)

    @staticmethod
    async def delete_office(session, office_id: UUID) -> Dict[str, str]:
        """
        Delete an office
        """
        # Check if office exists
        existing_office = await OfficeMgmtCRUD.get_by_id(session, office_id)
        if not existing_office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Optional: Add business rules before deletion
        # Example: Check if office has active employees or resources

        success = await OfficeMgmtCRUD.delete(session, office_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete office",
            )

        return {"message": f"Office with ID {office_id} deleted successfully"}

    @staticmethod
    async def get_all_offices(session) -> List[OfficeRead]:
        """
        Get all offices
        """
        offices = await OfficeMgmtCRUD.get_all(session)

        if not offices:
            return []

        return [OfficeRead(**office) for office in offices]

    @staticmethod
    async def get_offices_by_status(session, status: str) -> List[OfficeRead]:
        """
        Get only active offices
        """
        is_active: bool = True if status == "active" else False
        offices = await OfficeMgmtCRUD.get_by_status(session, is_active=is_active)

        if not offices:
            return []

        return [OfficeRead(**office) for office in offices]

    @staticmethod
    async def deactivate_office(session, office_id: UUID) -> OfficeRead:
        """
        Deactivate an office (soft delete)
        """
        office = await OfficeMgmtCRUD.get_by_id(session, office_id)

        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Update only the is_active field
        updated_office = await OfficeMgmtCRUD.update(
            session, office_id, {"is_active": False}
        )

        if not updated_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate office",
            )

        return OfficeRead(**updated_office)
