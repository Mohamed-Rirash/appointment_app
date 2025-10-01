"""
Enhanced Office Management Services with Host Assignment
"""

import asyncio
import uuid
from datetime import date, datetime
from typing import Dict, List, Optional
from uuid import UUID

from databases import Database
from fastapi import HTTPException, status

from app.admin.exceptions import (
    OfficeNotFoundError,
    OfficeAlreadyExistsError,
    InvalidOfficeDataError,
    HostNotFoundError,
    HostAlreadyAssignedError,
    HostAssignmentError,
    OfficeMembershipError,
    InvalidMembershipDataError,
    DuplicateMembershipError,
    PrimaryContactRequiredError,
    UserNotFoundError,
)
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
    OfficeWithMembersRead,
    HostAssignmentCreate,
    HostAssignmentRead,
    HostAssignmentUpdate,
    UserHostStatus,
    BulkHostAssignment,
    OfficeStats,
)
from app.office_mgnt.utils import generate_slots, has_excluded_role
from app.core.cache import cache_manager


async def _log_admin_action(
    db: Database, action: str, resource_id: UUID, details: Dict = None
):
    """
    Helper function to log admin actions for audit purposes
    """
    try:
        # This would integrate with the admin audit logging system
        # For now, we'll just use a simple print statement
        print(
            f"Admin action: {action} on resource {resource_id} with details: {details}"
        )
        # TODO: Integrate with proper audit logging
    except Exception as e:
        print(f"Failed to log admin action: {e}")


class EnhancedOfficeService:
    """Enhanced office management with comprehensive validation and host assignment"""

    @staticmethod
    async def create_office(
        db: Database, office_data: sch.OfficeCreate
    ) -> sch.OfficeRead:
        """
        Create a new office with comprehensive validation
        """
        try:
            # Check if office already exists by name
            existing_office = await OfficeMgmtCRUD.get_by_name(db, office_data.name)
            if existing_office:
                raise OfficeAlreadyExistsError(office_data.name)

            # Create office with audit logging
            office_dict = office_data.model_dump()
            created_office = await OfficeMgmtCRUD.create(db, office_dict)

            if not created_office:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create office due to server error",
                )

            # Log office creation
            await _log_admin_action(
                db,
                "office_created",
                created_office["id"],
                {"office_name": office_data.name, "location": office_data.location},
            )

            # ✅ Invalidate office cache
            await cache_manager.delete("offices:all")

            return sch.OfficeRead(**created_office)

        except (OfficeAlreadyExistsError, HTTPException):
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error creating office: {str(e)}",
            )

    @staticmethod
    async def get_office(db: Database, office_id: UUID) -> sch.OfficeRead:
        """
        Get office with enhanced error handling
        """
        office = await OfficeMgmtCRUD.get_by_id(db, office_id)
        if not office:
            raise OfficeNotFoundError(str(office_id))

        return sch.OfficeRead(**office)

    @staticmethod
    async def get_office_with_details(
        db: Database, office_id: UUID
    ) -> sch.OfficeWithMembersRead:
        """
        Get office with members, hosts, and statistics
        """
        # Get basic office info
        office = await OfficeMgmtCRUD.get_by_id(db, office_id)
        if not office:
            raise OfficeNotFoundError(str(office_id))

        # Get office members
        members = await OfficeMembershipService.list_office_members(db, office_id)

        # Get office hosts (users who can host appointments)
        hosts = await OfficeMembershipService.list_office_hosts(db, office_id)

        # Calculate statistics
        total_members = len(members)
        active_members = len([m for m in members if m.get("membership_active", True)])

        # Find primary contact
        primary_contact = None
        for member in members:
            if member.get("is_primary"):
                primary_contact = {
                    "user_id": member["user_id"],
                    "name": f"{member['first_name']} {member['last_name']}",
                    "email": member["email"],
                }
                break

        return sch.OfficeWithMembersRead(
            **office,
            total_members=total_members,
            active_members=active_members,
            primary_contact=primary_contact,
            hosts=[sch.HostAssignmentRead(**host) for host in hosts] if hosts else [],
        )

    @staticmethod
    async def update_office(
        db: Database, office_id: UUID, office_data: sch.OfficeUpdate
    ) -> sch.OfficeRead:
        """
        Update office with validation and audit logging
        """
        try:
            # Check if office exists
            existing_office = await OfficeMgmtCRUD.get_by_id(db, office_id)
            if not existing_office:
                raise OfficeNotFoundError(str(office_id))

            # Check for name conflict if name is being changed
            if office_data.name and office_data.name != existing_office.get("name"):
                office_with_same_name = await OfficeMgmtCRUD.get_by_name(
                    db, office_data.name
                )
                if office_with_same_name:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
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

            # Log office update
            await _log_admin_action(
                db,
                "office_updated",
                office_id,
                {"updated_fields": list(office_dict.keys())},
            )

            # ✅ Invalidate office cache
            await cache_manager.delete("offices:all")

            return sch.OfficeRead(**updated_office)

        except (OfficeNotFoundError, HTTPException):
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error updating office: {str(e)}",
            )

    @staticmethod
    async def delete_office(db: Database, office_id: UUID) -> Dict[str, str]:
        """
        Delete office with comprehensive checks
        """
        try:
            # Check if office exists
            existing_office = await OfficeMgmtCRUD.get_by_id(db, office_id)
            if not existing_office:
                raise OfficeNotFoundError(str(office_id))

            # Check for active members
            users = await OfficeMembershipService.list_office_members(db, office_id)
            if users:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete office with active members. Please remove all members first.",
                )

            # Check for active hosts
            hosts = await OfficeMembershipService.list_office_hosts(db, office_id)
            if hosts:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete office with assigned hosts. Please unassign all hosts first.",
                )

            # Delete office
            success = await OfficeMgmtCRUD.delete(db, office_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to delete office",
                )

            # Log office deletion
            await _log_admin_action(
                db,
                "office_deleted",
                office_id,
                {"office_name": existing_office.get("name")},
            )

            # ✅ Invalidate office cache
            await cache_manager.delete("offices:all")

            return {
                "message": f"Office '{existing_office.get('name')}' deleted successfully"
            }

        except (OfficeNotFoundError, HTTPException):
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error deleting office: {str(e)}",
            )

    @staticmethod
    async def get_all_offices(db: Database) -> List[sch.OfficeRead]:
        """
        Get all offices with caching - OPTIMIZED
        """
        # ✅ OPTIMIZED: Try cache first (5 minute TTL)
        cache_key = "offices:all"
        cached = await cache_manager.get(cache_key)
        if cached:
            return [sch.OfficeRead(**office) for office in cached]

        try:
            offices = await OfficeMgmtCRUD.get_all(db)
            result = [sch.OfficeRead(**office) for office in offices] if offices else []

            # ✅ Cache for 5 minutes (300 seconds)
            if result:
                await cache_manager.set(
                    cache_key, [office.model_dump() for office in result], ttl=300
                )

            return result
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve offices: {str(e)}",
            )

    @staticmethod
    async def get_offices_by_status(db: Database, status: str) -> List[sch.OfficeRead]:
        """
        Get offices by status (active/deactivated)
        """
        try:
            is_active = True if status == "active" else False
            offices = await OfficeMgmtCRUD.get_by_status(db, is_active=is_active)
            return [sch.OfficeRead(**office) for office in offices] if offices else []
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve offices by status: {str(e)}",
            )


class HostAssignmentService:
    """Service for managing host assignments to offices"""

    @staticmethod
    async def assign_host_to_office(
        db: Database, assignment_data: sch.HostAssignmentCreate, assigned_by: UUID
    ) -> sch.HostAssignmentRead:
        """
        Assign a host to an office with comprehensive validation
        """
        try:
            # Validate office exists
            office = await OfficeMgmtCRUD.get_by_id(db, assignment_data.office_id)
            if not office:
                raise OfficeNotFoundError(str(assignment_data.office_id))

            # Validate user exists and is not already a host of this office
            existing_assignment = await OfficeMembershipMgmtCRUD.get_host_assignment(
                db, assignment_data.host_id, assignment_data.office_id
            )
            if existing_assignment:
                raise HostAlreadyAssignedError(
                    str(assignment_data.host_id), str(assignment_data.office_id)
                )

            # Create host assignment through membership system
            membership_data = {
                "user_id": assignment_data.host_id,
                "office_id": assignment_data.office_id,
                "position": "Host",
                "is_primary": assignment_data.is_primary,
                "assigned_by_id": assigned_by,
            }

            created = await OfficeMembershipMgmtCRUD.create_membership(
                db, assignment_data.office_id, membership_data
            )

            if not created:
                raise HostAssignmentError(
                    str(assignment_data.host_id),
                    str(assignment_data.office_id),
                    "Failed to create host assignment",
                )

            # Get the created assignment with user details
            assignment_with_details = (
                await OfficeMembershipMgmtCRUD.get_membership_by_id(db, created["id"])
            )

            # Log host assignment
            await _log_admin_action(
                db,
                "host_assigned",
                assignment_data.office_id,
                {
                    "host_id": str(assignment_data.host_id),
                    "office_id": str(assignment_data.office_id),
                    "is_primary": assignment_data.is_primary,
                },
            )

            return sch.HostAssignmentRead(**assignment_with_details)

        except (
            OfficeNotFoundError,
            HostAlreadyAssignedError,
            HostAssignmentError,
            HTTPException,
        ):
            raise
        except Exception as e:
            raise HostAssignmentError(
                str(assignment_data.host_id),
                str(assignment_data.office_id),
                f"Unexpected error: {str(e)}",
            )

    @staticmethod
    async def bulk_assign_hosts(
        db: Database, assignments: List[sch.HostAssignmentCreate], assigned_by: UUID
    ) -> List[sch.HostAssignmentRead]:
        """
        Bulk assign multiple hosts to offices
        """
        results = []
        errors = []

        for assignment in assignments:
            try:
                result = await HostAssignmentService.assign_host_to_office(
                    db, assignment, assigned_by
                )
                results.append(result)
            except Exception as e:
                errors.append(
                    {
                        "host_id": str(assignment.host_id),
                        "office_id": str(assignment.office_id),
                        "error": str(e),
                    }
                )

        if errors and not results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"All host assignments failed: {errors}",
            )

        return results

    @staticmethod
    async def get_host_assignments(
        db: Database, office_id: Optional[UUID] = None, host_id: Optional[UUID] = None
    ) -> List[sch.HostAssignmentRead]:
        """
        Get host assignments with optional filtering
        """
        try:
            assignments = await OfficeMembershipMgmtCRUD.get_host_assignments(
                db, office_id=office_id, host_id=host_id
            )
            return [sch.HostAssignmentRead(**assignment) for assignment in assignments]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve host assignments: {str(e)}",
            )

    @staticmethod
    async def update_host_assignment(
        db: Database,
        host_id: UUID,
        office_id: UUID,
        update_data: sch.HostAssignmentUpdate,
    ) -> sch.HostAssignmentRead:
        """
        Update host assignment (primary status, active status)
        """
        try:
            # Get existing assignment
            existing = await OfficeMembershipMgmtCRUD.get_host_assignment(
                db, host_id, office_id
            )
            if not existing:
                raise HostAssignmentError(
                    str(host_id), str(office_id), "Host not assigned to this office"
                )

            # Update assignment
            update_dict = update_data.model_dump(exclude_unset=True)
            updated = await OfficeMembershipMgmtCRUD.update_membership(
                db, office_id, host_id, update_dict
            )

            if not updated:
                raise HostAssignmentError(
                    str(host_id), str(office_id), "Failed to update host assignment"
                )

            # Get updated assignment with details
            updated_with_details = await OfficeMembershipMgmtCRUD.get_membership_by_id(
                db, existing["membership_id"]
            )

            # Log host assignment update
            await _log_admin_action(
                db,
                "host_assignment_updated",
                office_id,
                {
                    "host_id": str(host_id),
                    "office_id": str(office_id),
                    "updated_fields": list(update_dict.keys()),
                },
            )

            return sch.HostAssignmentRead(**updated_with_details)

        except (HostAssignmentError, HTTPException):
            raise
        except Exception as e:
            raise HostAssignmentError(
                str(host_id), str(office_id), f"Unexpected error: {str(e)}"
            )

    @staticmethod
    async def remove_host_from_office(
        db: Database, host_id: UUID, office_id: UUID
    ) -> Dict[str, str]:
        """
        Remove host from office with validation
        """
        try:
            # Check if assignment exists
            existing = await OfficeMembershipMgmtCRUD.get_host_assignment(
                db, host_id, office_id
            )
            if not existing:
                raise HostNotFoundError(str(host_id))

            # Check if this is the only primary host
            if existing.get("is_primary"):
                primary_hosts = await OfficeMembershipMgmtCRUD.get_primary_hosts(
                    db, office_id
                )
                if len(primary_hosts) == 1:  # This is the only primary host
                    raise PrimaryContactRequiredError(str(office_id))

            # Remove assignment
            success = await OfficeMembershipMgmtCRUD.soft_delete_membership(
                db, office_id, existing["membership_id"]
            )

            if not success:
                raise HostAssignmentError(
                    str(host_id), str(office_id), "Failed to remove host assignment"
                )

            # Log host removal
            await _log_admin_action(
                db,
                "host_removed",
                office_id,
                {
                    "host_id": str(host_id),
                    "office_id": str(office_id),
                },
            )

            return {"message": f"Host {host_id} removed from office {office_id}"}

        except (
            HostNotFoundError,
            PrimaryContactRequiredError,
            HostAssignmentError,
            HTTPException,
        ):
            raise
        except Exception as e:
            raise HostAssignmentError(
                str(host_id), str(office_id), f"Unexpected error: {str(e)}"
            )


class OfficeStatsService:
    """Service for generating office statistics and reports"""

    @staticmethod
    async def get_office_stats(db: Database, office_id: UUID) -> sch.OfficeStats:
        """
        Get comprehensive statistics for an office
        """
        try:
            # Get basic office info
            office = await OfficeMgmtCRUD.get_by_id(db, office_id)
            if not office:
                raise OfficeNotFoundError(str(office_id))

            # Get member counts
            members = await OfficeMembershipService.list_office_members(db, office_id)
            total_members = len(members)
            active_members = len(
                [m for m in members if m.get("membership_active", True)]
            )

            # Get host counts
            hosts = await OfficeMembershipService.list_office_hosts(db, office_id)
            total_hosts = len(hosts)
            active_hosts = len([h for h in hosts if h.get("membership_active", True)])

            # TODO: Get appointment statistics from appointments module
            # This would require integration with the appointments service
            total_appointments = 0
            pending_appointments = 0
            completed_appointments = 0

            return sch.OfficeStats(
                office_id=office_id,
                office_name=office.get("name", ""),
                total_members=total_members,
                active_members=active_members,
                total_hosts=total_hosts,
                active_hosts=active_hosts,
                total_appointments=total_appointments,
                pending_appointments=pending_appointments,
                completed_appointments=completed_appointments,
            )

        except (OfficeNotFoundError, HTTPException):
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get office statistics: {str(e)}",
            )

    @staticmethod
    async def get_all_office_stats(db: Database) -> List[sch.OfficeStats]:
        """
        Get statistics for all offices - OPTIMIZED with parallel execution
        """
        try:
            offices = await OfficeMgmtCRUD.get_all(db)

            if not offices:
                return []

            # ✅ OPTIMIZED: Use asyncio.gather for parallel execution
            # This executes all stat queries concurrently instead of sequentially
            tasks = [
                OfficeStatsService.get_office_stats(db, office["id"])
                for office in offices
            ]

            # Execute all queries in parallel, catching exceptions
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Filter out errors and return successful results
            stats = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    # Log error but continue with other offices
                    print(
                        f"Failed to get stats for office {offices[i]['id']}: {result}"
                    )
                else:
                    stats.append(result)

            return stats

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get office statistics: {str(e)}",
            )


# Legacy OfficeService class (keeping for backward compatibility)
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
        db, office_id: UUID, user_id: UUID, data: MembershipUpdate
    ) -> dict[str, str]:
        """
        Update an existing membership by office_id and user_id.
        """
        # First check if membership exists
        existing_membership = await OfficeMembershipMgmtCRUD.get_membership_by_user_and_office(
            db, user_id, office_id
        )
        if not existing_membership:
            raise HTTPException(status_code=404, detail="Membership not found")

        updated = await OfficeMembershipMgmtCRUD.update_membership(
            db, office_id, user_id, data.model_dump(exclude_unset=True)
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Membership not found")

        return {"message": "Membership updated successfully"}

    @staticmethod
    async def remove_office_member(
        db, office_id: UUID, user_id: UUID
    ) -> Dict[str, str]:
        """
        Soft delete a membership from an office by office_id and user_id.
        """
        # First check if membership exists by user_id and office_id
        existing = await OfficeMembershipMgmtCRUD.get_membership_by_user_and_office(
            db, user_id, office_id
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Membership not found")

        success = await OfficeMembershipMgmtCRUD.soft_delete_membership(
            db, office_id, existing["id"]
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove membership",
            )

        return {"message": f"Membership for user {user_id} in office {office_id} removed successfully"}

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
