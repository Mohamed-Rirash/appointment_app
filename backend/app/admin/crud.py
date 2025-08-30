"""
Admin module CRUD operations
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from databases import Database
from sqlalchemy import and_, asc, delete, desc, func, insert, or_, select, update
from sqlalchemy.sql import Select

from app.admin.exceptions import RoleNotFoundError, UserNotFoundError
from app.admin.models import (
    admin_audit_logs,
    admin_notifications,
    admin_preferences,
    admin_sessions,
    bulk_operations,
    data_exports,
    system_alerts,
    system_backups,
    system_config,
    system_metrics,
    user_activities,
)
from app.admin.schemas import (
    AdminActionType,
    AdminActivityFilters,
    PaginationParams,
    SortOrder,
    UserSearchFilters,
)
from app.auth.models import permissions, role_permissions, roles, user_roles, users


class AdminUserCRUD:
    """CRUD operations for admin user management"""

    @staticmethod
    async def get_users_paginated(
        db: Database,
        pagination: PaginationParams,
        filters: Optional[UserSearchFilters] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get paginated list of users with filters"""

        # Base query
        query = select(users)
        count_query = select(func.count()).select_from(users)

        # Apply filters
        if filters:
            conditions = []

            if filters.search:
                search_term = f"%{filters.search}%"
                conditions.append(
                    or_(
                        users.c.first_name.ilike(search_term),
                        users.c.last_name.ilike(search_term),
                        users.c.email.ilike(search_term),
                    )
                )

            if filters.is_active is not None:
                conditions.append(users.c.is_active == filters.is_active)

            if filters.is_verified is not None:
                conditions.append(users.c.is_verified == filters.is_verified)

            if filters.is_system_user is not None:
                conditions.append(users.c.is_system_user == filters.is_system_user)

            if filters.created_after:
                conditions.append(users.c.created_at >= filters.created_after)

            if filters.created_before:
                conditions.append(users.c.created_at <= filters.created_before)

            if conditions:
                query = query.where(and_(*conditions))
                count_query = count_query.where(and_(*conditions))

        # Get total count
        total = await db.fetch_val(count_query)

        # Apply sorting
        if pagination.sort_by:
            sort_column = getattr(users.c, pagination.sort_by, users.c.created_at)
            if pagination.sort_order == SortOrder.ASC:
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(users.c.created_at))

        # Apply pagination
        offset = (pagination.page - 1) * pagination.size
        query = query.offset(offset).limit(pagination.size)

        # Execute query
        results = await db.fetch_all(query)

        return [dict(user) for user in results], total

    @staticmethod
    async def get_user_with_roles(
        db: Database, user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Get user with their roles and permissions"""

        # Get user
        user_query = select(users).where(users.c.id == user_id)
        user = await db.fetch_one(user_query)

        if not user:
            return None

        user_dict = dict(user)

        # Get user roles
        roles_query = (
            select(roles.c.id, roles.c.name, roles.c.display_name)
            .select_from(roles.join(user_roles, roles.c.id == user_roles.c.role_id))
            .where(user_roles.c.user_id == user_id)
        )

        user_roles_result = await db.fetch_all(roles_query)
        user_dict["roles"] = [dict(role) for role in user_roles_result]

        # Get user permissions
        permissions_query = (
            select(permissions.c.name)
            .select_from(
                permissions.join(
                    role_permissions,
                    permissions.c.id == role_permissions.c.permission_id,
                ).join(user_roles, role_permissions.c.role_id == user_roles.c.role_id)
            )
            .where(user_roles.c.user_id == user_id)
            .distinct()
        )

        user_permissions = await db.fetch_all(permissions_query)
        user_dict["permissions"] = [perm["name"] for perm in user_permissions]

        return user_dict

    @staticmethod
    async def create_user(
        db: Database, user_data: Dict[str, Any], created_by: UUID
    ) -> Dict[str, Any]:
        """Create a new user"""

        user_data["id"] = uuid.uuid4()
        # Note: created_by is tracked in audit logs, not in users table

        query = insert(users).values(**user_data)
        await db.execute(query)

        return await AdminUserCRUD.get_user_with_roles(db, user_data["id"])

    @staticmethod
    async def update_user(
        db: Database, user_id: UUID, user_data: Dict[str, Any], updated_by: UUID
    ) -> Dict[str, Any]:
        """Update user"""

        # Note: updated_by is tracked in audit logs, not in users table

        query = update(users).where(users.c.id == user_id).values(**user_data)
        result = await db.execute(query)

        if result == 0:
            raise UserNotFoundError(str(user_id))

        return await AdminUserCRUD.get_user_with_roles(db, user_id)

    @staticmethod
    async def delete_user(db: Database, user_id: UUID) -> bool:
        """Delete user (soft delete by deactivating)"""
        # Check if user exists and is not a system user
        user_query = select(users).where(users.c.id == user_id)
        user = await db.fetch_one(user_query)
        if not user:
            raise UserNotFoundError(str(user_id))
        # convert to dict
        user = dict(user) if user else {}
        print("##############################################################")
        print(user)
        print("##############################################################")

        if user["is_system_user"]:
            raise ValueError("System users cannot be deleted")

        # Soft delete by deactivating
        query = (
            update(users)
            .where(users.c.id == user_id)
            .values(is_active=False, updated_at=datetime.now(timezone.utc))
        )

        await db.execute(query)
        return True

    @staticmethod
    async def bulk_update_users(
        db: Database,
        user_ids: List[UUID],
        update_data: Dict[str, Any],
        updated_by: UUID,
    ) -> Dict[str, Any]:
        """Bulk update users"""

        update_data["updated_at"] = datetime.now(timezone.utc)
        # Note: updated_by is tracked in audit logs, not in users table

        query = update(users).where(users.c.id.in_(user_ids)).values(**update_data)

        result = await db.execute(query)

        return {"updated_count": result, "requested_count": len(user_ids)}


class AdminRoleCRUD:
    """CRUD operations for admin role management"""

    @staticmethod
    async def get_roles_paginated(
        db: Database, pagination: PaginationParams, include_user_count: bool = True
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get paginated list of roles"""

        if include_user_count:
            # Query with user count
            query = (
                select(roles, func.count(user_roles.c.user_id).label("user_count"))
                .select_from(
                    roles.outerjoin(user_roles, roles.c.id == user_roles.c.role_id)
                )
                .group_by(roles.c.id)
            )
        else:
            query = select(roles)

        count_query = select(func.count()).select_from(roles)

        # Get total count
        total = await db.fetch_val(count_query)

        # Apply sorting
        if pagination.sort_by:
            sort_column = getattr(roles.c, pagination.sort_by, roles.c.created_at)
            if pagination.sort_order == SortOrder.ASC:
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(roles.c.created_at))

        # Apply pagination
        offset = (pagination.page - 1) * pagination.size
        query = query.offset(offset).limit(pagination.size)

        # Execute query
        results = await db.fetch_all(query)

        return [dict(role) for role in results], total

    @staticmethod
    async def get_role_with_permissions(
        db: Database, role_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Get role with its permissions"""

        # Get role
        role_query = select(roles).where(roles.c.id == role_id)
        role = await db.fetch_one(role_query)

        if not role:
            return None

        role_dict = dict(role)

        # Get role permissions
        permissions_query = (
            select(permissions.c.id, permissions.c.name, permissions.c.display_name)
            .select_from(
                permissions.join(
                    role_permissions,
                    permissions.c.id == role_permissions.c.permission_id,
                )
            )
            .where(role_permissions.c.role_id == role_id)
        )

        role_permissions_result = await db.fetch_all(permissions_query)
        role_dict["permissions"] = [dict(perm) for perm in role_permissions_result]

        return role_dict


class AdminAuditCRUD:
    """CRUD operations for admin audit logging"""

    @staticmethod
    async def get_audit_logs_paginated(
        db: Database,
        pagination: PaginationParams,
        filters: Optional[AdminActivityFilters] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get paginated audit logs with filters"""

        # Base query with admin info
        query = select(
            admin_audit_logs,
            users.c.email.label("admin_email"),
            users.c.first_name.label("admin_first_name"),
            users.c.last_name.label("admin_last_name"),
        ).select_from(
            admin_audit_logs.join(users, admin_audit_logs.c.admin_id == users.c.id)
        )

        count_query = select(func.count()).select_from(admin_audit_logs)

        # Apply filters
        if filters:
            conditions = []

            if filters.admin_id:
                conditions.append(admin_audit_logs.c.admin_id == filters.admin_id)

            if filters.action:
                conditions.append(admin_audit_logs.c.action == filters.action.value)

            if filters.resource_type:
                conditions.append(
                    admin_audit_logs.c.resource_type == filters.resource_type
                )

            if filters.success is not None:
                conditions.append(admin_audit_logs.c.success == filters.success)

            if filters.date_from:
                conditions.append(admin_audit_logs.c.timestamp >= filters.date_from)

            if filters.date_to:
                conditions.append(admin_audit_logs.c.timestamp <= filters.date_to)

            if filters.ip_address:
                conditions.append(admin_audit_logs.c.ip_address == filters.ip_address)

            if conditions:
                query = query.where(and_(*conditions))
                count_query = count_query.where(and_(*conditions))

        # Get total count
        total = await db.fetch_val(count_query)

        # Apply sorting
        query = query.order_by(desc(admin_audit_logs.c.timestamp))

        # Apply pagination
        offset = (pagination.page - 1) * pagination.size
        query = query.offset(offset).limit(pagination.size)

        # Execute query
        results = await db.fetch_all(query)

        return [dict(log) for log in results], total


class AdminSystemCRUD:
    """CRUD operations for system management"""

    @staticmethod
    async def get_system_stats(db: Database) -> Dict[str, Any]:
        """Get system statistics"""

        # User statistics
        total_users = await db.fetch_val(select(func.count()).select_from(users))
        active_users = await db.fetch_val(
            select(func.count()).select_from(users).where(users.c.is_active == True)
        )
        verified_users = await db.fetch_val(
            select(func.count()).select_from(users).where(users.c.is_verified == True)
        )
        system_users = await db.fetch_val(
            select(func.count())
            .select_from(users)
            .where(users.c.is_system_user == True)
        )

        # Role statistics
        total_roles = await db.fetch_val(select(func.count()).select_from(roles))
        active_roles = await db.fetch_val(
            select(func.count()).select_from(roles).where(roles.c.is_active == True)
        )

        # Permission statistics
        total_permissions = await db.fetch_val(
            select(func.count()).select_from(permissions)
        )
        active_permissions = await db.fetch_val(
            select(func.count())
            .select_from(permissions)
            .where(permissions.c.is_active == True)
        )

        # Recent activity (last 24 hours)
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_logins = await db.fetch_val(
            select(func.count())
            .select_from(user_activities)
            .where(
                and_(
                    user_activities.c.activity_type == "login",
                    user_activities.c.timestamp >= yesterday,
                )
            )
        )

        recent_registrations = await db.fetch_val(
            select(func.count())
            .select_from(users)
            .where(users.c.created_at >= yesterday)
        )

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "system_users": system_users,
            "total_roles": total_roles,
            "active_roles": active_roles,
            "total_permissions": total_permissions,
            "active_permissions": active_permissions,
            "recent_logins_24h": recent_logins,
            "recent_registrations_24h": recent_registrations,
        }
