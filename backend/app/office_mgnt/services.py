import uuid
from datetime import date, datetime
from typing import Dict, List
from uuid import UUID

from fastapi import HTTPException, status

from app.office_mgnt import schemas
from app.office_mgnt import schemas as sch
from app.office_mgnt.crud import (
    AvailabilityCRUD,
    OfficeMembershipMgmtCRUD,
    OfficeMgmtCRUD,
    TimeSlotCRUD,
)
from app.office_mgnt.schemas import (
    HostAvailabilityCreate,
    MembershipCreate,
    MembershipRead,
    MembershipUpdate,
    OfficeCreate,
    OfficeRead,
    OfficeUpdate,
    Slot,
)
from app.office_mgnt.utils import generate_slots, has_excluded_role


class OfficeService:
    @staticmethod
    async def create_office(db, office_data: OfficeCreate) -> OfficeRead:
        """
        Create a new office after validating business rules
        """
        # Check if office already exists by name
        existing_office = await OfficeMgmtCRUD.get_by_name(
            db, office_name=office_data.name
        )
        if existing_office:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Office with this name already exists",
            )

        # Create office
        office_dict = office_data.model_dump()
        created_office = await OfficeMgmtCRUD.create(db, office_dict)

        if not created_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create office due to server error",
            )

        return OfficeRead(**created_office)

    @staticmethod
    async def get_office(db, office_id: UUID) -> OfficeRead:
        """
        Get a single office by ID
        """
        office = await OfficeMgmtCRUD.get_by_id(db, office_id)

        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        return OfficeRead(**office)

    @staticmethod
    async def update_office(
        db, office_id: UUID, office_data: OfficeUpdate
    ) -> OfficeRead:
        """
        Update an existing office
        """
        # Check if office exists
        existing_office = await OfficeMgmtCRUD.get_by_id(db, office_id)
        if not existing_office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Check for name conflict (if name is being changed)
        if office_data.name != existing_office.get("name"):
            office_with_same_name = await OfficeMgmtCRUD.get_by_name(
                db=db, office_name=office_data.name
            )
            if office_with_same_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Another office already exists with this name",
                )

        # Update office
        office_dict = office_data.model_dump(exclude_unset=True)
        updated_office = await OfficeMgmtCRUD.update(db, office_id, office_dict)

        if not updated_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update office",
            )

        return OfficeRead(**updated_office)

    @staticmethod
    async def delete_office(db, office_id: UUID) -> Dict[str, str]:
        """
        Delete an office
        """
        # Check if office exists
        existing_office = await OfficeMgmtCRUD.get_by_id(db, office_id)
        if not existing_office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # FIX: what if office has active employees or resources and we delete it
        try:
            users = await OfficeMembershipService.list_office_members(db, office_id)
            if users:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Office has active members",
                )
        except Exception:
            pass

        success = await OfficeMgmtCRUD.delete(db, office_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete office",
            )

        return {"message": f"Office with ID {office_id} deleted successfully"}

    @staticmethod
    async def get_all_offices(db) -> List[OfficeRead]:
        """
        Get all offices
        """
        offices = await OfficeMgmtCRUD.get_all(db)

        if not offices:
            return []

        return [OfficeRead(**office) for office in offices]

    @staticmethod
    async def get_offices_by_status(db, status: str) -> List[OfficeRead]:
        """
        Get only active offices
        """
        is_active: bool = True if status == "active" else False
        offices = await OfficeMgmtCRUD.get_by_status(db, is_active=is_active)

        if not offices:
            return []

        return [OfficeRead(**office) for office in offices]

    @staticmethod
    async def deactivate_office(db, office_id: UUID) -> OfficeRead:
        """
        Deactivate an office (soft delete)
        """
        office = await OfficeMgmtCRUD.get_by_id(db, office_id)

        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Update only the is_active field
        updated_office = await OfficeMgmtCRUD.update(
            db, office_id, {"is_active": False}
        )

        if not updated_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate office",
            )

        return OfficeRead(**updated_office)

    @staticmethod
    async def activate_office(db, office_id: UUID) -> OfficeRead:
        """
        activate an office (soft delete)
        """
        office = await OfficeMgmtCRUD.get_by_id(db, office_id)

        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {office_id} not found",
            )

        # Update only the is_active field
        updated_office = await OfficeMgmtCRUD.update(db, office_id, {"is_active": True})

        if not updated_office:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate office",
            )

        return OfficeRead(**updated_office)


class OfficeMembershipService:
    @staticmethod
    async def fetch_unassigned_users(db):
        """
        Fetch all users who are not assigned to any office.
        """
        unassigned_users = await OfficeMembershipMgmtCRUD.get_unassigned_users(db)
        return unassigned_users

    @staticmethod
    async def assign_user_to_office(
        db, office_id: UUID, membership_data: MembershipCreate, admin_id: UUID
    ) -> dict[str, str]:
        """
        Assign a user to an office.
        - Ensure the user is not already assigned to this office.
        """

        existing_membership = await OfficeMembershipMgmtCRUD.get_membership(
            db, membership_data.user_id
        )
        if existing_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already assigned to an office",
            )
        # lets add assigned by admin id
        membership_data_dict = membership_data.model_dump()
        membership_data_dict["assigned_by_id"] = admin_id

        created = await OfficeMembershipMgmtCRUD.create_membership(
            db, office_id, membership_data_dict
        )

        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign user to office",
            )

        return {"message": "User assigned to office successfully"}

    @staticmethod
    async def list_office_members(db, office_id: UUID) -> List[MembershipRead]:
        """
        List all members of a given office.
        """
        members = await OfficeMembershipMgmtCRUD.get_members_by_office(db, office_id)

        return [MembershipRead(**m) for m in members] if members else []

    @staticmethod
    async def list_office_hosts(db, office_id: UUID) -> List[MembershipRead]:
        """
        List all members of a given office, excluding secretaries and receptions by role.
        """
        members = await OfficeMembershipMgmtCRUD.get_members_by_office(db, office_id)

        filtered_members = []
        for m in members:
            if not await has_excluded_role(db, m["user_id"]):
                filtered_members.append(m)

        return [MembershipRead(**m) for m in filtered_members]

    @staticmethod
    async def update_office_member(
        db, office_id: UUID, membership_id: UUID, data: MembershipUpdate
    ) -> dict[str, str]:
        """
        Update an existing membership.
        """
        updated = await OfficeMembershipMgmtCRUD.update_membership(
            db, office_id, membership_id, data.model_dump(exclude_unset=True)
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Membership not found")

        return {"message": "Membership updated successfully"}

    @staticmethod
    async def remove_office_member(
        db, office_id: UUID, membership_id: UUID
    ) -> Dict[str, str]:
        """
        Soft delete a membership from an office.
        """
        existing = await OfficeMembershipMgmtCRUD.get_membership(db, membership_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Membership not found")

        success = await OfficeMembershipMgmtCRUD.soft_delete_membership(
            db, office_id, membership_id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove membership",
            )

        return {"message": f"Membership {membership_id} removed successfully"}

    @staticmethod
    async def list_user_offices(db, user_id: UUID) -> List[MembershipRead]:
        """
        List all offices that a user is a member of.
        """
        memberships = await OfficeMembershipMgmtCRUD.get_user_memberships(db, user_id)
        return [MembershipRead(**m) for m in memberships] if memberships else []

    @staticmethod
    async def search_office_members(
        db,
        search_term: str,
    ) -> List[MembershipRead]:
        """
        Search memberships by name, position, or office.
        """
        records = await OfficeMembershipMgmtCRUD.search_office_members(
            db, search_term=search_term
        )
        return [MembershipRead(**r) for r in records] if records else []


# =================Available time slots for a given day/time period ===============
# TODO: Implement this
# -[] for host and secretry let them to tell their Available time slots for meetings
# -[]
class AvailabilityService:
    @staticmethod
    async def set_availability(
        db, host_id: UUID, office_id: UUID, data: sch.HostAvailabilityCreate
    ):
        # Clear previous rules (avoid overlapping)
        if data.specific_date:
            await AvailabilityCRUD.delete_by_date(db, office_id, data.specific_date)
        elif data.daysofweek:
            await AvailabilityCRUD.delete_by_day(db, office_id, data.daysofweek)

        record = await AvailabilityCRUD.create(db, office_id, data)
        return sch.HostAvailabilityRead(**record)

    @staticmethod
    async def get_availability(db, office_id: UUID) -> List[sch.HostAvailabilityRead]:
        rows = await AvailabilityCRUD.list_by_host(db, office_id)
        return [sch.HostAvailabilityRead(**r) for r in rows]

    @staticmethod
    async def get_slots_for_date(
        db, office_id: UUID, target_date: date
    ) -> List[sch.Slot]:
        # 1. Check if slots already generated
        existing_slots = await TimeSlotCRUD.get_slots_by_date(
            db, office_id, target_date
        )
        if existing_slots:
            return [sch.Slot(**s) for s in existing_slots]

        # 2. Fetch availability (recurring + one-time)
        availabilities = await AvailabilityCRUD.list_for_date(
            db, office_id, target_date
        )

        # 3. Generate slots
        slots_to_insert = []
        for a in availabilities:
            generated = generate_slots(a["start_time"], a["end_time"], interval=15)
            for s in generated:
                slots_to_insert.append(
                    {
                        "id": uuid.uuid4(),
                        "office_id": office_id,
                        "slot_start": s["slot_start"].time(),
                        "slot_end": s["slot_end"].time(),
                        "date": target_date,
                        "is_booked": False,
                    }
                )

        # 4. Persist + return
        if slots_to_insert:
            await TimeSlotCRUD.bulk_insert_slots(db, slots_to_insert)

        return [sch.Slot(**s) for s in slots_to_insert]
