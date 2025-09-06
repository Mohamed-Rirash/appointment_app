from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.office_mgnt.crud import OfficeMembershipMgmtCRUD, OfficeMgmtCRUD
from app.office_mgnt.schemas import (
    MembershipCreate,
    MembershipRead,
    MembershipUpdate,
    OfficeCreate,
    OfficeRead,
    OfficeUpdate,
)


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


class OfficeMembershipService:
    @staticmethod
    async def assign_user_to_office(
        session, office_id: UUID, membership_data: MembershipCreate, admin_id: UUID
    ) -> MembershipRead:
        """
        Assign a user to an office.
        - Ensure the user is not already assigned to this office.
        """
        existing_membership = await OfficeMembershipMgmtCRUD.get_membership(
            session, office_id, membership_data.user_id
        )
        if existing_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already assigned to this office",
            )
        # lets add assigned by admin id
        membership_data_dict = membership_data.model_dump()
        membership_data_dict["assigned_by_id"] = admin_id

        created = await OfficeMembershipMgmtCRUD.create_membership(
            session, office_id, membership_data_dict
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign user to office",
            )

        return MembershipRead(**created)

    @staticmethod
    async def list_office_members(session, office_id: UUID) -> List[MembershipRead]:
        """
        List all members of a given office.
        """
        members = await OfficeMembershipMgmtCRUD.get_members_by_office(
            session, office_id
        )
        return [MembershipRead(**m) for m in members] if members else []

    @staticmethod
    async def get_office_member(
        session, office_id: UUID, membership_id: UUID
    ) -> MembershipRead:
        """
        Get a specific membership record.
        """
        record = await OfficeMembershipMgmtCRUD.get_membership(
            session, office_id, membership_id
        )
        if not record:
            raise HTTPException(status_code=404, detail="Membership not found")

        return MembershipRead(**record)

    @staticmethod
    async def update_office_member(
        session, office_id: UUID, membership_id: UUID, data: MembershipUpdate
    ) -> MembershipRead:
        """
        Update an existing membership.
        """
        updated = await OfficeMembershipMgmtCRUD.update_membership(
            session, office_id, membership_id, data.model_dump(exclude_unset=True)
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Membership not found")

        return MembershipRead(**updated)

    @staticmethod
    async def remove_office_member(
        session, office_id: UUID, membership_id: UUID
    ) -> Dict[str, str]:
        """
        Soft delete a membership from an office.
        """
        existing = await OfficeMembershipMgmtCRUD.get_membership(
            session, office_id, membership_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Membership not found")

        success = await OfficeMembershipMgmtCRUD.soft_delete_membership(
            session, office_id, membership_id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove membership",
            )

        return {"message": f"Membership {membership_id} removed successfully"}

    @staticmethod
    async def list_user_offices(session, user_id: UUID) -> List[MembershipRead]:
        """
        List all offices that a user is a member of.
        """
        memberships = await OfficeMembershipMgmtCRUD.get_user_memberships(
            session, user_id
        )
        return [MembershipRead(**m) for m in memberships] if memberships else []

    @staticmethod
    async def search_office_members(
        session,
        name: Optional[str] = None,
        position: Optional[str] = None,
        office_id: Optional[UUID] = None,
    ) -> List[MembershipRead]:
        """
        Search memberships by name, position, or office.
        """
        records = await OfficeMembershipMgmtCRUD.search_memberships(
            session, name=name, position=position, office_id=office_id
        )
        return [MembershipRead(**r) for r in records] if records else []

    @staticmethod
    async def get_office_primary_contact(session, office_id: UUID) -> MembershipRead:
        """
        Get the primary contact of an office.
        """
        record = await OfficeMembershipMgmtCRUD.get_primary_contact(session, office_id)
        if not record:
            raise HTTPException(status_code=404, detail="Primary contact not found")

        return MembershipRead(**record)
