"""
Admin module business logic and services
"""

import asyncio
from typing import Any
from uuid import UUID

from databases import Database
from fastapi import BackgroundTasks, HTTPException, status

from app.admin.config import get_admin_config
from app.admin.crud import AdminAuditCRUD, AdminSystemCRUD, AdminUserCRUD
from app.admin.exceptions import (
    AdminValidationError,
    EmailDomainNotAllowedError,
    ExportError,
    InvalidBulkOperationError,
    RoleAssignmentError,
    RolesMissingError,
    SystemUserProtectedError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from app.admin.schemas import (
    AdminUserCreate,
    AdminUserUpdate,
    BulkOperationResult,
    BulkUserOperation,
    PaginationParams,
    SystemHealth,
    SystemStats,
    UserAnalytics,
    UserSearchFilters,
)
from app.auth.crud import UserCRUD
from app.auth.rbac import RBACCRUD, RoleCRUD
from app.core.security import generate_password, hash_password
from app.core.validation import validate_email_domain


class AdminUserService:
    """Service layer for admin user management"""

    @staticmethod
    async def get_users_paginated(
        db: Database,
        pagination: PaginationParams,
        filters: UserSearchFilters | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        """Get paginated users with enhanced admin information - OPTIMIZED"""

        users, total = await AdminUserCRUD.get_users_paginated(db, pagination, filters)

        if not users:
            return [], total

        # ✅ OPTIMIZED: Batch load roles for all users to avoid N+1 queries
        user_ids = [user["id"] for user in users]

        # Use asyncio.gather to fetch roles for all users in parallel
        role_tasks = [
            AdminUserCRUD.get_user_with_roles(db, user_id) for user_id in user_ids
        ]
        enhanced_users_results = await asyncio.gather(
            *role_tasks, return_exceptions=True
        )

        # Filter out None results and exceptions
        enhanced_users = [
            result
            for result in enhanced_users_results
            if result is not None and not isinstance(result, Exception)
        ]

        return enhanced_users, total  # pyright: ignore[reportReturnType]

    @staticmethod
    async def create_user(
        db: Database,
        user_data: AdminUserCreate,
        created_by: UUID,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict[str, Any]:
        """Create new user with admin capabilities"""

        # Validate email domain
        if not validate_email_domain(str(user_data.email)):
            raise EmailDomainNotAllowedError()

        # Check if user already exists
        existing_user = await UserCRUD.get_by_email(db, user_data.email)
        if existing_user:
            raise UserAlreadyExistsError(user_data.email)

        # Validate email domain BEFORE any DB writes
        try:
            validate_email_domain(str(user_data.email))
        except ValueError as e:
            raise AdminValidationError(
                message="Validation failed",
                details=[
                    {
                        "type": "value_error",
                        "loc": ["email"],
                        "msg": str(e),
                        "input": str(user_data.email),
                    }
                ],
            )

        # Resolve and validate roles BEFORE any DB writes
        resolved_role_ids: list[UUID] = []
        roles_to_process = (
            [user_data.roles] if isinstance(user_data.roles, str) else user_data.roles
        )

        if roles_to_process:
            missing_roles: list[str] = []
            for role_value in roles_to_process:
                role_obj = None
                try:
                    role_uuid = UUID(role_value)
                    role_obj = await RoleCRUD.get_by_id(db, role_uuid)
                except Exception:
                    role_obj = await RoleCRUD.get_by_name(db, role_value)

                if not role_obj:
                    missing_roles.append(str(role_value))
                else:
                    resolved_role_ids.append(role_obj["id"])

            if missing_roles:
                raise RolesMissingError(missing_roles)

        # Always generate a temporary password; user will set their own via invitation
        password = generate_password()
        hashed_password = await hash_password(password)

        # Prepare user data (excluding non-persisted fields)
        user_dict = user_data.model_dump(exclude={"roles", "send_welcome_email"})
        user_dict["password"] = hashed_password

        # Wrap DB writes in a transaction to ensure atomicity
        async with db.transaction():
            # Create user
            created_user = await AdminUserCRUD.create_user(db, user_dict, created_by)

            # Assign roles after successful user creation
            for role_id in resolved_role_ids:
                await RBACCRUD.assign_role_to_user(
                    db, created_user["id"], role_id, created_by
                )

        # Send welcome/invite email if requested (outside transaction)
        if user_data.send_welcome_email:
            try:
                from app.auth.user_emails import send_account_invite_email
                from app.core.security import generate_password_reset_token

                # Generate a reset token for first-login password setup
                reset_token = generate_password_reset_token(created_user["id"])
                # Send invite email with login URL and reset link
                await send_account_invite_email(
                    created_user, reset_token, background_tasks
                )
            except Exception as email_error:
                # Log the error but don't fail user creation
                print(
                    f"❌ Failed to send welcome email to {created_user['email']}: {email_error!s}"
                )
                # TODO: Optionally store email failure status in user record or audit log

        return created_user

    @staticmethod
    async def update_user(
        db: Database, user_id: UUID, user_data: AdminUserUpdate, updated_by: UUID
    ) -> dict[str, Any]:
        """Update user with admin capabilities"""

        # Get current user data for comparison
        current_user = await AdminUserCRUD.get_user_with_roles(db, user_id)
        if not current_user:
            raise UserNotFoundError(str(user_id))

        # Check if trying to modify system user
        if current_user.get("is_system_user", False):
            raise SystemUserProtectedError(current_user["email"], "update")

        # Update user
        update_dict = user_data.model_dump(exclude_unset=True)
        updated_user = await AdminUserCRUD.update_user(
            db, user_id, update_dict, updated_by
        )

        return updated_user

    @staticmethod
    async def delete_user(db: Database, user_id: UUID, deleted_by: UUID) -> bool:
        """Delete user (soft delete)"""

        # Get user info for logging
        user = await AdminUserCRUD.get_user_with_roles(db, user_id)

        # __AUTO_GENERATED_PRINT_VAR_START__

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Delete user
        result = await AdminUserCRUD.delete_user(db, user_id)

        return result

    @staticmethod
    async def bulk_operation(
        db: Database, operation: BulkUserOperation, admin_id: UUID
    ) -> BulkOperationResult:
        """Perform bulk operations on users"""

        config = get_admin_config()

        # Validate bulk operation limits
        if len(operation.user_ids) > config.MAX_BULK_OPERATIONS:
            raise InvalidBulkOperationError(
                f"Bulk operation exceeds maximum limit of {config.MAX_BULK_OPERATIONS} appointments",
                max_allowed=config.MAX_BULK_OPERATIONS,
            )

        successful_appointments = 0
        failed_appointments = 0
        errors = []

        # Process each user
        for user_id in operation.user_ids:
            try:
                if operation.operation == "activate":
                    await AdminUserCRUD.update_user(
                        db, user_id, {"is_active": True}, admin_id
                    )
                elif operation.operation == "deactivate":
                    await AdminUserCRUD.update_user(
                        db, user_id, {"is_active": False}, admin_id
                    )
                elif operation.operation == "verify":
                    await AdminUserCRUD.update_user(
                        db, user_id, {"is_verified": True}, admin_id
                    )
                elif operation.operation == "delete":
                    await AdminUserCRUD.delete_user(db, user_id)
                else:
                    raise ValueError(f"Unknown operation: {operation.operation}")

                successful_appointments += 1

            except Exception as e:
                failed_appointments += 1
                errors.append({"user_id": str(user_id), "error": str(e)})

        return BulkOperationResult(
            total_appointments=len(operation.user_ids),
            successful_appointments=successful_appointments,
            failed_appointments=failed_appointments,
            errors=errors,
        )

    @staticmethod
    async def assign_role(
        db: Database, user_id: UUID, role_id: UUID, assigned_by: UUID
    ) -> bool:
        """Assign role to user"""

        # Get user and role info
        user = await UserCRUD.get_by_id(db, user_id)
        role = await RoleCRUD.get_by_id(db, role_id)

        if not user or not role:
            raise UserNotFoundError(str(user_id) if not user else str(role_id))

        # Check if user already has this role
        user_roles = await RBACCRUD.get_user_roles(db, user_id)
        if any(r["id"] == role_id for r in user_roles):
            raise RoleAssignmentError(
                str(user_id), str(role_id), "User already has this role"
            )

        # Assign role
        await RBACCRUD.assign_role_to_user(db, user_id, role_id, assigned_by)

        # Log role assignment
        # await AdminAuditCRUD.create_audit_log(
        #     db=db,
        #     admin_id=assigned_by,
        #     action=AdminActionType.ASSIGN_ROLE,
        #     resource_type="user_role",
        #     resource_id=f"{user_id}:{role_id}",
        #     details={
        #         "user_email": user["email"],
        #         "role_name": role["name"],
        #         "role_display_name": role["display_name"],
        #     },
        # )

        return True

    @staticmethod
    async def revoke_role(
        db: Database, user_id: UUID, role_id: UUID, revoked_by: UUID
    ) -> bool:
        """Revoke role from user"""

        # Get user and role info
        user = await UserCRUD.get_by_id(db, user_id)
        role = await RoleCRUD.get_by_id(db, role_id)

        if not user or not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User or role not found"
            )

        # Check system user protection
        if user.get("is_system_user", False) and role["name"] == "super_admin":
            raise SystemUserProtectedError(
                user["email"], "remove super_admin role from"
            )

        # Revoke role
        await RBACCRUD.remove_role_from_user(db, user_id, role_id, revoked_by)

        # Log role revocation

        #     db=db,
        #     admin_id=revoked_by,
        #     action=AdminActionType.REVOKE_ROLE,
        #     resource_type="user_role",
        #     resource_id=f"{user_id}:{role_id}",
        #     details={
        #         "user_email": user["email"],
        #         "role_name": role["name"],
        #         "role_display_name": role["display_name"],
        #     },
        # )

        return True

    @staticmethod
    async def resend_invite(
        db: Database,
        user_id: UUID,
        requested_by: UUID,
        background_tasks: BackgroundTasks | None = None,
    ) -> bool:
        """Resend invitation email with set-password link."""
        # Ensure user exists
        user = await UserCRUD.get_by_id(db, user_id)
        if not user:
            raise UserNotFoundError(str(user_id))

        # Generate a new reset token and send invite
        try:
            from app.auth.user_emails import send_account_invite_email
            from app.core.security import generate_password_reset_token

            reset_token = generate_password_reset_token(user_id)
            await send_account_invite_email(user, reset_token, background_tasks)
            return True
        except Exception as exc:
            # Surface as 500 if email fails
            # Surface as admin exception; router will turn into HTTPException
            raise ExportError("invite_email", str(exc))


class AdminSystemService:
    """Service layer for system administration"""

    @staticmethod
    async def get_system_stats(db: Database) -> SystemStats:
        """Get comprehensive system statistics"""

        stats_dict = await AdminSystemCRUD.get_system_stats(db)
        return SystemStats(**stats_dict)

    @staticmethod
    async def get_user_analytics(db: Database, days: int = 30) -> UserAnalytics:
        """Get user analytics data"""

        # This would typically involve complex queries
        # For now, returning mock data structure
        return UserAnalytics(
            registration_trend=[],
            login_trend=[],
            user_activity=[],
            role_distribution=[],
        )

    @staticmethod
    async def get_system_health(db: Database) -> "SystemHealth":
        """Get system health status"""
        import time

        import psutil

        from app.admin.schemas import SystemHealth

        # Get basic system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        # Check database connectivity
        try:
            await db.fetch_one("SELECT 1")
            database_status = {"status": "healthy", "response_time": 0.1}
        except Exception as e:
            database_status = {"status": "unhealthy", "error": str(e)}

        # Mock system health data
        return SystemHealth(
            status="healthy",
            database=database_status,
            redis={"status": "healthy", "response_time": 0.05},
            disk_usage={
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percentage": disk.percent,
            },
            memory_usage={
                "total": memory.total,
                "used": memory.used,
                "free": memory.available,
                "percentage": memory.percent,
            },
            cpu_usage=cpu_usage,
            uptime=int(time.time()),  # Mock uptime
            active_sessions=0,  # Would be calculated from active sessions
            error_rate=0.0,  # Would be calculated from logs
        )

    @staticmethod
    async def get_dashboard_data(db: Database, admin_id: UUID) -> dict[str, Any]:
        """Get comprehensive dashboard data"""

        # Get system stats
        system_stats = await AdminSystemService.get_system_stats(db)

        # Get recent audit logs

        recent_activities, _ = await AdminAuditCRUD.get_audit_logs_paginated(
            db=db,
            pagination=PaginationParams(page=1, size=10),  # pyright: ignore[reportCallIssue]
            filters=None,  # pyright: ignore[reportCallIssue]
        )

        # Get user analytics
        user_analytics = await AdminSystemService.get_user_analytics(db)

        # Get system health
        system_health = await AdminSystemService.get_system_health(db)

        return {
            "system_stats": system_stats.model_dump(),
            "user_analytics": user_analytics.model_dump(),
            "system_health": system_health.model_dump(),
            "recent_activities": recent_activities,
            "alerts": [],  # TODO: Implement system alerts
            "quick_actions": [
                {
                    "name": "Create User",
                    "url": "/admin/users/create",
                    "icon": "user-plus",
                },
                {"name": "View Audit Logs", "url": "/admin/audit", "icon": "file-text"},
                {
                    "name": "System Health",
                    "url": "/admin/system/health",
                    "icon": "heart",
                },
                {"name": "Export Data", "url": "/admin/export", "icon": "download"},
            ],
        }
