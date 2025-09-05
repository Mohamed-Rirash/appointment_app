import select
import uuid
from typing import Any, Optional

from databases import Database
from sqlalchemy import delete, func, insert, select, update

from app.auth.models import users
from app.office_mgnt.models import office_memberships, offices


class OfficeMgmtCRUD:
    @staticmethod
    async def create(session: Database, office_data: dict) -> Optional[dict[str, Any]]:
        office_data.setdefault("id", uuid.uuid4())
        query = insert(offices).values(**office_data).returning(*offices.c)
        result = await session.fetch_one(query)
        return (
            dict(result)
            if result
            else {"message": "office did not created successfully"}
        )

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
        query = (
            insert(office_memberships)
            .values(
                **data,
            )
            .returning(office_memberships)
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_members_by_office(session, office_id):
        query = select(office_memberships).where(
            office_memberships.c.office_id == office_id
        )
        result = await session.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def get_membership(session, office_id, membership_id):
        query = select(office_memberships).where(
            office_memberships.c.id == membership_id,
            office_memberships.c.office_id == office_id,
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

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
                office_memberships.c.office_id == office_id,
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
    async def search_memberships(session, name=None, position=None, office_id=None):
        query = select(
            office_memberships, users.c.name, offices.c.name.label("office_name")
        ).select_from(
            office_memberships.join(
                users, office_memberships.c.user_id == users.c.id
            ).join(offices, office_memberships.c.office_id == offices.c.id)
        )
        if name:
            query = query.where(users.c.name.ilike(f"%{name}%"))
        if position:
            query = query.where(office_memberships.c.position.ilike(f"%{position}%"))
        if office_id:
            query = query.where(office_memberships.c.office_id == office_id)
        result = await session.fetch_all(query)
        return [dict(row) for row in result]

    @staticmethod
    async def get_primary_contact(session, office_id):
        query = select(office_memberships).where(
            office_memberships.c.office_id == office_id,
            office_memberships.c.is_primary,
            office_memberships.c.is_active,
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None
