"""
Role-Based Access Control (RBAC) system implementation
"""

import json
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from databases import Database
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import and_, delete, func, insert, or_, select, update

from app.auth.models import (
    permissions,
    rbac_audit_log,
    role_permissions,
    roles,
    user_roles,
    users,
)
from app.core.security import hash_password
from app.loggs import log_security_event


class RBACError(Exception):
    """Base RBAC exception"""

    pass


class PermissionDeniedError(RBACError):
    """Permission denied exception"""

    pass


class RoleNotFoundError(RBACError):
    """Role not found exception"""

    pass


class PermissionNotFoundError(RBACError):
    """Permission not found exception"""

    pass


class RoleCRUD:
    """CRUD operations for roles"""

    @staticmethod
    async def create(db: Database, role_data: dict, created_by: UUID) -> dict:
        """Create a new role"""
        # Generate UUID if not provided
        if "id" not in role_data:
            from uuid import uuid4

            role_data["id"] = uuid4()

        query = insert(roles).values(**role_data).returning(roles)
        result = await db.fetch_one(query)

        if result and isinstance(created_by, uuid.UUID):
            # Log audit event only when performed_by is a real user id
            await RBACCRUD.log_audit_event(
                db,
                "role_created",
                "role",
                result["id"],
                performed_by=created_by,
                details=role_data,
            )

        return dict(result) if result else None

    @staticmethod
    async def get_by_id(db: Database, role_id: UUID) -> Optional[dict]:
        """Get role by ID"""
        query = select(roles).where(roles.c.id == role_id)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_roleid_by_user_id(db: Database, user_id: UUID) -> Optional[UUID]:
        """Get role id by user id"""
        query = select(user_roles).where(user_roles.c.user_id == user_id)
        result = await db.fetch_one(query)
        return result["role_id"] if result else None

    @staticmethod
    async def get_by_name(db: Database, name: str) -> Optional[dict]:
        """Get role by name"""
        query = select(roles).where(roles.c.name == name)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def list_all(db: Database, active_only: bool = True) -> List[dict]:
        """List all roles"""
        query = select(roles)
        if active_only:
            query = query.where(roles.c.is_active)
        query = query.order_by(roles.c.name)

        results = await db.fetch_all(query)
        return [dict(row) for row in results]

    @staticmethod
    async def update(
        db: Database, role_id: UUID, updates: dict, updated_by: UUID
    ) -> Optional[dict]:
        """Update a role"""
        # Don't allow updating system roles' core properties
        role = await RoleCRUD.get_by_id(db, role_id)
        if role and role["is_system"]:
            # Only allow updating description and display_name for system roles
            allowed_updates = {
                k: v
                for k, v in updates.appointments()
                if k in ["description", "display_name"]
            }
            updates = allowed_updates

        if not updates:
            return role

        # Use database-side current timestamp to avoid tz issues
        updates["updated_at"] = func.now()
        query = (
            update(roles)
            .where(roles.c.id == role_id)
            .values(**updates)
            .returning(roles)
        )
        result = await db.fetch_one(query)

        if result and isinstance(updated_by, uuid.UUID):
            await RBACCRUD.log_audit_event(
                db,
                "role_updated",
                "role",
                role_id,
                performed_by=updated_by,
                details=updates,
            )

        return dict(result) if result else None

    @staticmethod
    async def delete(db: Database, role_id: UUID, deleted_by: UUID) -> bool:
        """Delete a role (soft delete for system roles)"""
        role = await RoleCRUD.get_by_id(db, role_id)
        if not role:
            return False

        if role["is_system"]:
            # Soft delete system roles
            query = update(roles).where(roles.c.id == role_id).values(is_active=False)
        else:
            # Hard delete non-system roles
            query = delete(roles).where(roles.c.id == role_id)

        await db.execute(query)

        if isinstance(deleted_by, uuid.UUID):
            await RBACCRUD.log_audit_event(
                db,
                "role_deleted",
                "role",
                role_id,
                performed_by=deleted_by,
                details={"is_system": role["is_system"]},
            )

        return True


class PermissionCRUD:
    """CRUD operations for permissions"""

    @staticmethod
    async def create(db: Database, permission_data: dict, created_by: UUID) -> dict:
        """Create a new permission"""
        # Generate name from resource and action if not provided
        if "name" not in permission_data:
            permission_data["name"] = (
                f"{permission_data['resource']}:{permission_data['action']}"
            )

        # Generate UUID if not provided
        if "id" not in permission_data:
            from uuid import uuid4

            permission_data["id"] = uuid4()

        query = insert(permissions).values(**permission_data).returning(permissions)
        result = await db.fetch_one(query)

        if result and isinstance(created_by, uuid.UUID):
            await RBACCRUD.log_audit_event(
                db,
                "permission_created",
                "permission",
                result["id"],
                performed_by=created_by,
                details=permission_data,
            )

        return dict(result) if result else None

    @staticmethod
    async def get_by_id(db: Database, permission_id: UUID) -> Optional[dict]:
        """Get permission by ID"""
        query = select(permissions).where(permissions.c.id == permission_id)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def get_by_name(db: Database, name: str) -> Optional[dict]:
        """Get permission by name"""
        query = select(permissions).where(permissions.c.name == name)
        result = await db.fetch_one(query)
        return dict(result) if result else None

    @staticmethod
    async def list_all(db: Database, active_only: bool = True) -> List[dict]:
        """List all permissions"""
        query = select(permissions)
        if active_only:
            query = query.where(permissions.c.is_active == True)
        query = query.order_by(permissions.c.resource, permissions.c.action)

        results = await db.fetch_all(query)
        return [dict(row) for row in results]

    @staticmethod
    async def list_by_resource(db: Database, resource: str) -> List[dict]:
        """List permissions for a specific resource"""
        query = (
            select(permissions)
            .where(
                and_(
                    permissions.c.resource == resource, permissions.c.is_active == True
                )
            )
            .order_by(permissions.c.action)
        )

        results = await db.fetch_all(query)
        return [dict(row) for row in results]


class RBACCRUD:
    """Main RBAC operations"""

    @staticmethod
    async def assign_role_to_user(
        db: Database,
        user_id: UUID,
        role_id: UUID,
        assigned_by: UUID,
        expires_at: Optional[datetime] = None,
    ) -> bool:
        """Assign a role to a user"""
        # Check if assignment already exists
        existing_query = select(user_roles).where(
            and_(user_roles.c.user_id == user_id, user_roles.c.role_id == role_id)
        )
        existing = await db.fetch_one(existing_query)

        if existing:
            # Update existing assignment
            query = (
                update(user_roles)
                .where(
                    and_(
                        user_roles.c.user_id == user_id, user_roles.c.role_id == role_id
                    )
                )
                .values(
                    is_active=True,
                    expires_at=expires_at,
                    assigned_by=assigned_by,
                    assigned_at=func.now(),
                )
            )
        else:
            # Create new assignment
            query = insert(user_roles).values(
                id=uuid.uuid4(),
                user_id=user_id,
                role_id=role_id,
                assigned_by=assigned_by,
                expires_at=expires_at,
            )

        await db.execute(query)

        await RBACCRUD.log_audit_event(
            db,
            "role_assigned",
            "user",
            user_id,
            "role",
            role_id,
            performed_by=assigned_by,
            details={"expires_at": expires_at.isoformat() if expires_at else None},
        )

        return True

    @staticmethod
    async def remove_role_from_user(
        db: Database, user_id: UUID, role_id: UUID, removed_by: UUID
    ) -> bool:
        """Remove a role from a user"""
        query = (
            update(user_roles)
            .where(
                and_(user_roles.c.user_id == user_id, user_roles.c.role_id == role_id)
            )
            .values(is_active=False)
        )

        result = await db.execute(query)

        if result:
            await RBACCRUD.log_audit_event(
                db,
                "role_removed",
                "user",
                user_id,
                "role",
                role_id,
                performed_by=removed_by,
            )

        return result > 0

    @staticmethod
    async def grant_permission_to_role(
        db: Database, role_id: UUID, permission_id: UUID, granted_by: UUID
    ) -> bool:
        """Grant a permission to a role"""
        # Check if already granted
        existing_query = select(role_permissions).where(
            and_(
                role_permissions.c.role_id == role_id,
                role_permissions.c.permission_id == permission_id,
            )
        )
        existing = await db.fetch_one(existing_query)

        if existing:
            return True  # Already granted

        query = insert(role_permissions).values(
            role_id=role_id, permission_id=permission_id, granted_by=granted_by
        )

        await db.execute(query)

        if isinstance(granted_by, uuid.UUID):
            await RBACCRUD.log_audit_event(
                db,
                "permission_granted",
                "role",
                role_id,
                "permission",
                permission_id,
                performed_by=granted_by,
            )

        return True

    @staticmethod
    async def revoke_permission_from_role(
        db: Database, role_id: UUID, permission_id: UUID, revoked_by: UUID
    ) -> bool:
        """Revoke a permission from a role"""
        query = delete(role_permissions).where(
            and_(
                role_permissions.c.role_id == role_id,
                role_permissions.c.permission_id == permission_id,
            )
        )

        result = await db.execute(query)

        if result and isinstance(revoked_by, uuid.UUID):
            await RBACCRUD.log_audit_event(
                db,
                "permission_revoked",
                "role",
                role_id,
                "permission",
                permission_id,
                performed_by=revoked_by,
            )

        return result > 0

    @staticmethod
    async def get_user_roles(db: Database, user_id: UUID) -> List[dict]:
        """Get all active roles for a user"""
        query = (
            select(
                roles.c.id,
                roles.c.name,
                roles.c.display_name,
                roles.c.description,
                user_roles.c.assigned_at,
                user_roles.c.expires_at,
            )
            .select_from(user_roles.join(roles, user_roles.c.role_id == roles.c.id))
            .where(
                and_(
                    user_roles.c.user_id == user_id,
                    user_roles.c.is_active == True,
                    roles.c.is_active == True,
                    or_(
                        user_roles.c.expires_at.is_(None),
                        user_roles.c.expires_at > func.now(),
                    ),
                )
            )
        )

        results = await db.fetch_all(query)
        return [dict(row) for row in results]

    @staticmethod
    async def get_user_permissions(db: Database, user_id: UUID) -> List[dict]:
        """Get all permissions for a user through their roles"""
        query = (
            select(
                permissions.c.id,
                permissions.c.name,
                permissions.c.resource,
                permissions.c.action,
                permissions.c.description,
            )
            .select_from(
                user_roles.join(roles, user_roles.c.role_id == roles.c.id)
                .join(role_permissions, roles.c.id == role_permissions.c.role_id)
                .join(permissions, role_permissions.c.permission_id == permissions.c.id)
            )
            .where(
                and_(
                    user_roles.c.user_id == user_id,
                    user_roles.c.is_active == True,
                    roles.c.is_active == True,
                    permissions.c.is_active == True,
                    or_(
                        user_roles.c.expires_at.is_(None),
                        user_roles.c.expires_at > func.now(),
                    ),
                )
            )
            .distinct()
        )

        results = await db.fetch_all(query)
        return [dict(row) for row in results]

    @staticmethod
    async def user_has_permission(
        db: Database, user_id: UUID, resource: str, action: str
    ) -> bool:
        """Check if user has a specific permission"""
        query = (
            select(permissions.c.id)
            .select_from(
                user_roles.join(roles, user_roles.c.role_id == roles.c.id)
                .join(role_permissions, roles.c.id == role_permissions.c.role_id)
                .join(permissions, role_permissions.c.permission_id == permissions.c.id)
            )
            .where(
                and_(
                    user_roles.c.user_id == user_id,
                    user_roles.c.is_active == True,
                    roles.c.is_active == True,
                    permissions.c.is_active == True,
                    permissions.c.resource == resource,
                    permissions.c.action == action,
                    or_(
                        user_roles.c.expires_at.is_(None),
                        user_roles.c.expires_at > func.now(),
                    ),
                )
            )
        )

        result = await db.fetch_one(query)
        return result is not None

    @staticmethod
    async def log_audit_event(
        db: Database,
        action: str,
        resource_type: str,
        resource_id: UUID,
        target_type: Optional[str] = None,
        target_id: Optional[UUID] = None,
        performed_by: UUID = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        """Log an RBAC audit event"""
        # Handle system operations where performed_by might be a string
        if isinstance(performed_by, str) and performed_by == "system":
            performed_by = None

        audit_data = {
            "id": uuid.uuid4(),
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "target_type": target_type,
            "target_id": target_id,
            "performed_by": performed_by,
            "details": json.dumps(details, default=str) if details else None,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }

        query = insert(rbac_audit_log).values(**audit_data)
        await db.execute(query)
