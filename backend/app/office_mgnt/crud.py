import select
import uuid
from typing import Any, Optional

from databases import Database
from sqlalchemy import delete, insert, select, update

from app.office_mgnt.models import offices


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
        return dict(result) if result else {"message": "office not found"}

    @staticmethod
    async def get_by_status(
        session: Database, is_active: bool
    ) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.is_active == is_active)
        result = await session.fetch_one(query)
        return dict(result) if result else {"message": "office not found"}

    @staticmethod
    async def read_by_name(
        session: Database, office_name: str
    ) -> Optional[dict[str, Any]]:
        query = select(offices).where(offices.c.name == office_name)
        result = await session.fetch_one(query)
        return dict(result) if result else {"message": "office not found"}

    @staticmethod
    async def update(
        session: Database, office_id: uuid.UUID, office_data: dict
    ) -> Optional[dict[str, Any]]:
        query = update(offices).where(offices.c.id == office_id).values(**office_data)
        result = await session.fetch_one(query)
        return dict(result) if result else {"message": "office not updated"}

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
