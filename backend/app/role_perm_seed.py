#!/usr/bin/env python3
"""
Seed RBAC system with default roles, permissions, and the first admin user
"""

import asyncio
import sys
import uuid
from pathlib import Path

# Add app path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import insert, select

from app.auth.constants import DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLES
from app.auth.crud import RoleCRUD  # your crud module
from app.auth.crud import PermissionCRUD, RolePermissionCRUD, UserCRUD
from app.auth.models import (
    DEFAULT_PERMISSIONS,
    permissions,
    role_permissions,
    roles,
    user_roles,
    users,
)
from app.auth.security import hash_password  # assuming you have this
from app.config import get_settings
from app.database import database

settengs = get_settings()


async def init_permissions():
    print("🔑 Initializing permissions...")

    for perm in DEFAULT_PERMISSIONS:
        name = f"{perm['resource']}:{perm['action']}"
        query = select(permissions).where(permissions.c.name == name)
        existing = await database.fetch_one(query)

        if not existing:
            data = {
                "id": uuid.uuid4(),
                "name": name,
                **perm,
            }
            await database.execute(insert(permissions).values(data))
            print(f"✅ Created permission {name}")
        else:
            print(f"ℹ️ Permission {name} already exists")


async def init_roles():
    print("👥 Initializing roles...")

    for role in DEFAULT_ROLES:
        query = select(roles).where(roles.c.name == role["name"])
        existing = await database.fetch_one(query)

        if not existing:
            data = {
                "id": uuid.uuid4(),
                **role,
            }
            await database.execute(insert(roles).values(data))
            print(f"✅ Created role {role['name']}")
        else:
            print(f"ℹ️ Role {role['name']} already exists")


async def assign_permissions():
    print("🔗 Assigning permissions to roles...")

    # Get all permissions
    all_perms = await database.fetch_all(select(permissions))
    all_perms_dict = {p["name"]: p for p in all_perms}

    for role_name, perm_patterns in DEFAULT_ROLE_PERMISSIONS.items():
        role = await RoleCRUD.get_by_name(database, role_name)
        if not role:
            print(f"❌ Role {role_name} not found, skipping...")
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
                else:
                    if pattern in all_perms_dict:
                        perms_to_assign.append(all_perms_dict[pattern])

        for perm in perms_to_assign:
            try:
                await RolePermissionCRUD.assign_permission(
                    database, role["id"], perm["id"]
                )
                print(f"✅ Granted {perm['name']} to {role_name}")
            except Exception:
                # likely already assigned
                pass


async def create_first_admin():
    print("🛡️ Creating/verifying first admin user...")

    ADMIN_EMAIL = settengs.FIRST_SUPERUSER
    ADMIN_PASSWORD = settengs.FIRST_SUPERUSER_PASSWORD

    existing = await UserCRUD.get_by_email(database, ADMIN_EMAIL)
    if existing:
        print(f"ℹ️ Admin user already exists: {ADMIN_EMAIL}")
        return existing

    hashed_password = await hash_password(ADMIN_PASSWORD)
    admin_data = {
        "id": uuid.uuid4(),
        "first_name": "System",
        "last_name": "Admin",
        "email": ADMIN_EMAIL,
        "password": hashed_password,
        "is_active": True,
        "is_verified": True,
    }

    admin_user = await UserCRUD.create(database, admin_data)

    # Assign admin role
    admin_role = await RoleCRUD.get_by_name(database, "admin")
    if admin_role:
        query = insert(user_roles).values(
            id=uuid.uuid4(),
            user_id=admin_user["id"],
            role_id=admin_role["id"],
            assigned_by=admin_user["id"],
        )
        await database.execute(query)
        print(f"✅ Assigned admin role to {ADMIN_EMAIL}")

    print(f"✅ Created first admin user: {ADMIN_EMAIL} (password: {ADMIN_PASSWORD})")
    return admin_user


async def main():
    print("🚀 Seeding RBAC system...")
    await database.connect()

    await init_permissions()
    await init_roles()
    await assign_permissions()
    await create_first_admin()

    await database.disconnect()
    print("✅ Seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
