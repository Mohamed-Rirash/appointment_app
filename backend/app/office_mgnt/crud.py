import select
import uuid
from datetime import date
from typing import Any, Optional

from databases import Database
from sqlalchemy import and_, delete, func, insert, or_, select, update

from app.appointments.models import time_slot
from app.auth.models import roles, user_roles, users
from app.office_mgnt.models import host_availability, office_memberships, offices
from app.office_mgnt.schemas import HostAvailabilityCreate
from app.office_mgnt.views import office_member_details


class OfficeMgmtCRUD:
    @staticmethod
    async def create(db: Database, office_data: dict) -> Optional[dict[str, Any]]:
        office_data.setdefault("id", uuid.uuid4())
        query = insert(offices).values(**office_data).returning(*offices.c)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_id(db: Database, office_id: uuid.UUID) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.id == office_id)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_status(db: Database, is_active: bool) -> list[dict[str, Any]]:
        query = select(offices).where(offices.c.is_active == is_active)
        result = await db.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def get_by_name(db: Database, office_name: str) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.name == office_name)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def update(
        db: Database, office_id: uuid.UUID, office_data: dict
    ) -> Optional[dict[str, Any]]:
        query = (
            offices.update()
            .where(offices.c.id == office_id)
            .values(**office_data)
            .returning(offices)
        )
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def delete(db: Database, office_id: uuid.UUID) -> Optional[dict[str, Any]]:
        query = delete(offices).where(offices.c.id == office_id)
        result = await db.fetch_one(query)
        return dict(result) if result else {"message": "office not deleted"}

    @staticmethod
    async def get_all(db: Database) -> list[dict[str, Any]]:
        query = select(offices)
        result = await db.fetch_all(query)
        return [dict(row) for row in result]


class OfficeMembershipMgmtCRUD:
    # app/office_memberships/crud.py
    # @staticmethod
    # async def get_unassigned_users(db):
    #     query = select(users).where(
    #         ~users.c.id.in_(select(office_memberships.c.user_id))
    #     )
    #     result = await db.fetch_all(query)
    #     return [dict(row) for row in result]
    #
    @staticmethod
    async def get_unassigned_users(db):
        # Subquery: users assigned to an office
        assigned_users_subq = select(office_memberships.c.user_id)

        # Subquery: users who have "admin" or "reception" role
        excluded_roles_subq = (
            select(user_roles.c.user_id)
            .join(roles, roles.c.id == user_roles.c.role_id)
            .where(roles.c.name.in_(["admin", "reception"]))
        )

        # Main query: users not in office AND not in excluded roles
        query = (
            select(users)
            .where(~users.c.id.in_(assigned_users_subq))
            .where(~users.c.id.in_(excluded_roles_subq))
        )

        result = await db.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def create_membership(db, office_id, data):
        data.setdefault("id", uuid.uuid4())
        query = (
            insert(office_memberships)
            .values(
                **data,
                office_id=office_id,
            )
            .returning(office_memberships)
        )
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_membership(db, membership_id):
        query = select(office_memberships).where(
            # office_memberships.c.office_id == office_id,
            office_memberships.c.user_id
            == membership_id,
        )
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_members_by_office(db, office_id):
        j = office_memberships.join(users, office_memberships.c.user_id == users.c.id)
        query = (
            select(
                users.c.id.label("user_id"),
                users.c.first_name,
                users.c.last_name,
                users.c.email,
                users.c.is_active.label("user_active"),
                office_memberships.c.id.label("membership_id"),
                office_memberships.c.position,
                office_memberships.c.is_primary,
                office_memberships.c.is_active.label("membership_active"),
                office_memberships.c.assigned_at,
            )
            .select_from(j)
            .where(office_memberships.c.office_id == office_id)
        )
        result = await db.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def update_membership(db, office_id, membership_id, data):
        query = (
            update(office_memberships)
            .where(
                office_memberships.c.id == membership_id,
                office_memberships.c.office_id == office_id,
            )
            .values(**data)
            .returning(office_memberships)
        )
        return await db.fetch_one(query)

    @staticmethod
    async def soft_delete_membership(db, office_id, membership_id):
        query = (
            update(office_memberships)
            .where(
                office_memberships.c.id == membership_id,
                and_(
                    office_memberships.c.office_id == office_id,
                ),
            )
            .values(is_active=False, ended_at=func.now())
        )
        return await db.execute(query)

    @staticmethod
    async def get_user_memberships(db, user_id):
        query = select(office_memberships).where(
            office_memberships.c.user_id == user_id
        )
        return await db.fetch_all(query)

    @staticmethod
    async def search_office_members(db, search_term: str):
        """
        Search office members by first name, last name, position, or office name.
        """
        pattern = f"%{search_term}%"

        query = select(office_member_details).where(
            or_(
                office_member_details.c.first_name.ilike(pattern),
                office_member_details.c.last_name.ilike(pattern),
                office_member_details.c.position.ilike(pattern),
                office_member_details.c.office_name.ilike(pattern),
            )
        )

        result = await db.fetch_all(query)
        return [dict(row) for row in result.mappings()]


class AvailabilityCRUD:
    @staticmethod
    async def create(db, office_id, data):
        query = (
            insert(host_availability)
            .values(
                id=uuid.uuid4(),
                office_id=office_id,
                daysofweek=data.daysofweek,
                specific_date=data.specific_date,
                start_time=data.start_time,
                end_time=data.end_time,
                is_recurring=data.is_recurring,
            )
            .returning(host_availability)
        )
        result = await db.fetch_one(query)
        return dict(result)

    @staticmethod
    async def list_for_date(db, office_id, target_date: date):
        weekday = target_date.strftime("%A").upper()
        query = (
            select(host_availability)
            .where(host_availability.c.office_id == office_id)
            .where(
                (host_availability.c.specific_date == target_date)
                | (
                    (host_availability.c.daysofweek == weekday)
                    & (host_availability.c.is_recurring.is_(True))
                )
            )
        )
        rows = await db.fetch_all(query)
        return [dict(r) for r in rows]

    @staticmethod
    async def list_by_host(db, office_id):
        query = select(host_availability).where(
            host_availability.c.office_id == office_id
        )
        rows = await db.fetch_all(query)
        return [dict(r) for r in rows]

    @staticmethod
    async def delete_by_day(db, office_id, day_of_week):
        query = delete(host_availability).where(
            (host_availability.c.office_id == office_id)
            & (host_availability.c.daysofweek == day_of_week.upper())
        )
        await db.execute(query)

    @staticmethod
    async def delete_by_date(db, office_id, target_date):
        query = delete(host_availability).where(
            (host_availability.c.office_id == office_id)
            & (host_availability.c.specific_date == target_date)
        )
        await db.execute(query)


class TimeSlotCRUD:
    @staticmethod
    async def get_slots_by_date(db, office_id, target_date):
        query = (
            select(time_slot)
            .where(time_slot.c.office_id == office_id)
            .where(time_slot.c.date == target_date)
        )
        rows = await db.fetch_all(query)
        return [dict(r) for r in rows]

    @staticmethod
    async def bulk_insert_slots(db, slots: list[dict]):
        query = insert(time_slot)
        await db.execute_many(query, slots)
