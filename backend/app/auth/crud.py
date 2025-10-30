import uuid
from typing import Any

from databases import Database
from pydantic import EmailStr
from sqlalchemy import delete, insert, select, update

from app.office_mgnt.models import office_memberships

from .models import permissions, role_permissions, roles, users


# ------------------------------
# USER CRUD
# ------------------------------
class UserCRUD:
    @staticmethod
    async def get_users_office_by_id(session: Database, user_id: uuid.UUID):
        query = select(
            office_memberships.c.office_id, office_memberships.c.position
        ).where(office_memberships.c.user_id == user_id)
        result = await session.fetch_one(query)
        if result is not None:
            return dict(result)
        return None

    @staticmethod
    async def create(session: Database, user_data: dict) -> dict[str, Any] | None:
        # Ensure ID exists
        user_data.setdefault("id", uuid.uuid4())

        # Build insert query
        query = (
            insert(users)
            .values(**user_data)
            .returning(*users.c)  # return all columns of the inserted row
        )

        # Execute query
        result = await session.fetch_one(query)

        return dict(result) if result else None

    @staticmethod
    async def get_by_id(session: Database, user_id: uuid.UUID):
        query = select(users).where(users.c.id == user_id)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_email(session: Database, email: EmailStr):
        query = select(users).where(users.c.email == email)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def update(session: Database, user_id: uuid.UUID, update_data: dict):
        query = (
            update(users)
            .where(users.c.id == user_id)
            .values(**update_data)
            .returning(users)
        )
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def delete(session: Database, user_id: uuid.UUID):
        query = delete(users).where(users.c.id == user_id)
        await session.execute(query)


# ------------------------------
# ROLE CRUD
# ------------------------------
class RoleCRUD:
    @staticmethod
    async def create(session: Database, role_data: dict) -> dict[str, Any] | None:
        if "id" not in role_data:
            role_data["id"] = uuid.uuid4()

        query = insert(roles).values(**role_data).returning(roles)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_id(session: Database, role_id: uuid.UUID):
        query = select(roles).where(roles.c.id == role_id)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_name(session: Database, name: str):
        query = select(roles).where(roles.c.name == name)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def list(session: Database) -> list[dict]:
        query = select(roles)
        rows = await session.fetch_all(query)
        return [dict(row) for row in rows]

    @staticmethod
    async def delete(session: Database, role_id: uuid.UUID):
        query = delete(roles).where(roles.c.id == role_id)
        await session.execute(query)


# ------------------------------
# PERMISSION CRUD
# ------------------------------
class PermissionCRUD:
    @staticmethod
    async def create(session: Database, permission_data: dict) -> dict[str, Any] | None:
        if "id" not in permission_data:
            permission_data["id"] = uuid.uuid4()

        query = insert(permissions).values(**permission_data).returning(permissions)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def list(session: Database) -> list[dict]:
        query = select(permissions)
        rows = await session.fetch_all(query)
        return [dict(row) for row in rows]


# ------------------------------
# ROLE-PERMISSION LINK CRUD
# ------------------------------
class RolePermissionCRUD:
    @staticmethod
    async def assign_permission(
        session: Database, role_id: uuid.UUID, permission_id: uuid.UUID
    ):
        data = {
            "id": uuid.uuid4(),
            "role_id": role_id,
            "permission_id": permission_id,
        }
        query = insert(role_permissions).values(**data).returning(role_permissions)
        result = await session.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_permissions_for_role(
        session: Database, role_id: uuid.UUID
    ) -> list[dict]:
        query = (
            select(permissions)
            .join(
                role_permissions,
                role_permissions.c.permission_id == permissions.c.id,
            )
            .where(role_permissions.c.role_id == role_id)
        )
        rows = await session.fetch_all(query)
        return [dict(row) for row in rows]
