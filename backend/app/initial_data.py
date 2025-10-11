#!/usr/bin/env python3
"""
Initialize (seed) RBAC data — roles, permissions, and first admin user.
"""

import asyncio
import logging
import sys
import uuid
from pathlib import Path

# Ensure root path is included for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import insert, select

from app.auth.constants import DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLES
from app.auth.crud import PermissionCRUD, RoleCRUD, RolePermissionCRUD, UserCRUD
from app.auth.models import (
    DEFAULT_PERMISSIONS,
    permissions,
    role_permissions,
    roles,
    user_roles,
    users,
)
from app.auth.security import hash_password
from app.config import get_settings
from app.database import database

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


# -----------------------------
# Seeding helper functions
# -----------------------------
async def init_permissions():
    logger.info("🔑 Initializing permissions...")

    for perm in DEFAULT_PERMISSIONS:
        name = f"{perm['resource']}:{perm['action']}"
        query = select(permissions).where(permissions.c.name == name)
        existing = await database.fetch_one(query)

        if not existing:
            data = {"id": uuid.uuid4(), "name": name, **perm}
            await database.execute(insert(permissions).values(data))
            logger.info(f"✅ Created permission: {name}")
        else:
            logger.info(f"ℹ️ Permission already exists: {name}")


async def init_roles():
    logger.info("👥 Initializing roles...")

    for role in DEFAULT_ROLES:
        query = select(roles).where(roles.c.name == role["name"])
        existing = await database.fetch_one(query)

        if not existing:
            data = {"id": uuid.uuid4(), **role}
            await database.execute(insert(roles).values(data))
            logger.info(f"✅ Created role: {role['name']}")
        else:
            logger.info(f"ℹ️ Role already exists: {role['name']}")


async def assign_permissions():
    logger.info("🔗 Assigning permissions to roles...")

    all_perms = await database.fetch_all(select(permissions))
    all_perms_dict = {p["name"]: p for p in all_perms}

    for role_name, perm_patterns in DEFAULT_ROLE_PERMISSIONS.items():
        role = await RoleCRUD.get_by_name(database, role_name)
        if not role:
            logger.warning(f"❌ Role not found: {role_name}")
            continue

        if perm_patterns == "*":
            perms_to_assign = all_perms
        else:
            perms_to_assign = []
            for pattern in perm_patterns:
                if pattern.endswith(":*"):
                    resource = pattern.split(":")[0]
                    perms_to_assign.extend(
                        [p for p in all_perms if p["resource"] == resource]
                    )
                elif pattern in all_perms_dict:
                    perms_to_assign.append(all_perms_dict[pattern])

        for perm in perms_to_assign:
            try:
                await RolePermissionCRUD.assign_permission(
                    database, role["id"], perm["id"]
                )
                logger.info(f"✅ Granted {perm['name']} to {role_name}")
            except Exception:
                pass  # already assigned


async def create_first_admin():
    logger.info("🛡️ Creating/verifying first admin user...")

    email = settings.FIRST_SUPERUSER
    password = settings.FIRST_SUPERUSER_PASSWORD

    existing = await UserCRUD.get_by_email(database, email)
    if existing:
        logger.info(f"ℹ️ Admin user already exists: {email}")
        return existing

    hashed_password = await hash_password(password)
    admin_data = {
        "id": uuid.uuid4(),
        "first_name": "System",
        "last_name": "Admin",
        "email": email,
        "password": hashed_password,
        "is_active": True,
        "is_verified": True,
        "is_system_user": True,
    }

    admin_user = await UserCRUD.create(database, admin_data)
    admin_role = await RoleCRUD.get_by_name(database, "admin")

    if admin_role:
        await database.execute(
            insert(user_roles).values(
                id=uuid.uuid4(),
                user_id=admin_user["id"],
                role_id=admin_role["id"],
                assigned_by=admin_user["id"],
            )
        )
        logger.info(f"✅ Assigned admin role to {email}")

    logger.info(f"✅ Created first admin user: {email} (password: {password})")
    return admin_user


# -----------------------------
# Entry points
# -----------------------------
async def init():
    """Run all initial seeding tasks"""
    await init_permissions()
    await init_roles()
    await assign_permissions()
    await create_first_admin()


async def main():
    logger.info("🚀 Starting database seeding...")
    await database.connect()
    await init()
    await database.disconnect()
    logger.info("✅ Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
