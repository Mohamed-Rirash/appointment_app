import select
import uuid
from typing import Any, Optional

from databases import Database
from sqlalchemy import and_, delete, func, insert, or_, select, update

from app.auth.models import users
from app.office_mgnt.models import host_availability, office_memberships, offices
from app.office_mgnt.schemas import HostAvailabilityCreate
from app.office_mgnt.views import office_member_details


class OfficeMgmtCRUD:
    @staticmethod
    async def create(session: Database, office_data: dict) -> Optional[dict[str, Any]]:
        office_data.setdefault("id", uuid.uuid4())
        query = insert(offices).values(**office_data).returning(*offices.c)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_id(
        session: Database, office_id: uuid.UUID
    ) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.id == office_id)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_status(session: Database, is_active: bool) -> list[dict[str, Any]]:
        query = select(offices).where(offices.c.is_active == is_active)
        result = await session.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def get_by_name(
        session: Database, office_name: str
    ) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.name == office_name)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def update(
        session: Database, office_id: uuid.UUID, office_data: dict
    ) -> Optional[dict[str, Any]]:
        query = (
            offices.update()
            .where(offices.c.id == office_id)
            .values(**office_data)
            .returning(offices)
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def delete(
        session: Database, office_id: uuid.UUID
    ) -> Optional[dict[str, Any]]:
        query = delete(offices).where(offices.c.id == office_id)
        result = await session.fetch_one(query)
        return dict(result) if result else {"message": "office not deleted"}

    @staticmethod
    async def get_all(session: Database) -> list[dict[str, Any]]:
        query = select(offices)
        result = await session.fetch_all(query)
        return [dict(row) for row in result]


class OfficeMembershipMgmtCRUD:
    # app/office_memberships/crud.py

    @staticmethod
    async def create_membership(session, office_id, data):
        data.setdefault("id", uuid.uuid4())
        query = (
            insert(office_memberships)
            .values(
                **data,
                office_id=office_id,
            )
            .returning(office_memberships)
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_membership(session, office_id, membership_id):
        query = select(office_memberships).where(
            office_memberships.c.office_id == office_id,
            office_memberships.c.user_id == membership_id,
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_members_by_office(session, office_id):
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
        result = await session.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def update_membership(session, office_id, membership_id, data):
        query = (
            update(office_memberships)
            .where(
                office_memberships.c.id == membership_id,
                office_memberships.c.office_id == office_id,
            )
            .values(**data)
            .returning(office_memberships)
        )
        return await session.fetch_one(query)

    @staticmethod
    async def soft_delete_membership(session, office_id, membership_id):
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
        return await session.execute(query)

    @staticmethod
    async def get_user_memberships(session, user_id):
        query = select(office_memberships).where(
            office_memberships.c.user_id == user_id
        )
        return await session.fetch_all(query)

    @staticmethod
    async def search_office_members(session, search_term: str):
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

        result = await session.fetch_all(query)
        return [dict(row) for row in result.mappings()]


class AvailabilityCRUD:
    @staticmethod
    async def create(session, office_id, data: HostAvailabilityCreate):
        query = (
            insert(host_availability)
            .values(
                office_id=office_id,
                day_of_week=data.dayofweek,
                start_time=data.start_time,
                end_time=data.end_time,
            )
            .returning(host_availability)
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def list_by_host(session, office_id):
        query = select(host_availability).where(
            host_availability.c.office_id == office_id
        )
        rows = await session.fetch_all(query)
        return [dict(r) for r in rows]

    @staticmethod
    async def delete_by_day(session, office_id, day_of_week):
        query = delete(host_availability).where(
            (host_availability.c.office_id == office_id)
            & (host_availability.c.day_of_week == day_of_week.lower())
        )
        await session.execute(query)
