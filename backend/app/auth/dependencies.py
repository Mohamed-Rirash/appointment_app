"""
Authentication and authorization dependencies for FastAPI
"""

from typing import List, Optional
from uuid import UUID

from databases import Database
from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.crud import UserCRUD
from app.auth.rbac import RBACCRUD
from app.config import get_settings
from app.core.security import TokenError, verify_token
from app.database import get_db
from app.loggs import log_auth_event, log_security_event

settings = get_settings()
security = HTTPBearer(scheme_name="BearerAuth", auto_error=False)


class CurrentUser:
    """Current user information"""

    def __init__(self, user_data: dict, permissions: List[dict]):
        self.id = user_data["id"]
        self.email = user_data["email"]
        self.first_name = user_data["first_name"]
        self.last_name = user_data["last_name"]
        self.is_active = user_data["is_active"]
        self.is_verified = user_data["is_verified"]
        self.is_system_user = user_data.get("is_system_user", False)
        self.created_at = user_data["created_at"]
        self.permissions = permissions or []
        self._user_data = user_data

    def has_permission(self, resource: str, action: str) -> bool:
        """Check if user has a specific permission"""
        permission_name = f"{resource}:{action}"
        return any(
            perm["name"] == permission_name
            or perm["name"] == f"{resource}:*"
            or perm["name"] == "*"
            for perm in self.permissions
        )

    # NOTE: do not forget to edit here for other resource
    @property
    def is_admin(self) -> bool:
        """Check if user has admin permissions"""
        # Check if user has any admin-level permissions
        admin_permissions = [
            "users:*",
            "roles:*",
            "permissions:*",
            "system:*",
            "admin:*",
        ]
        return any(
            perm["name"] in admin_permissions or perm["name"] == "*"
            for perm in self.permissions
        )

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return self._user_data


async def get_current_user_from_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Database = Depends(get_db),
) -> Optional[CurrentUser]:
    """Get current user from JWT token"""
    if not credentials:
        return None

    try:
        # Verify token
        payload = verify_token(credentials.credentials, "access")
        user_id = payload.get("sub")

        if not user_id:
            return None

        # Get user from database
        user = await UserCRUD.get_by_id(db, UUID(user_id))
        if not user:
            return None

        # Check if user is active and verified
        if not user["is_active"] or not user["is_verified"]:
            return None

        # Get user permissions
        permissions = await RBACCRUD.get_user_permissions(db, UUID(user_id))

        # Store user ID in request state for logging
        request.state.user_id = user_id

        # Log successful authentication
        log_auth_event(
            event_type="token_authentication",
            user_id=user_id,
            email=user["email"],
            success=True,
            ip_address=_get_client_ip(request),
        )

        return CurrentUser(user, permissions)

    except TokenError as e:
        log_auth_event(
            event_type="token_authentication",
            success=False,
            reason=str(e),
            ip_address=_get_client_ip(request),
        )
        # Extra debug print so we can see the raw header coming through
        auth_header = request.headers.get("authorization")
        # print(
        #     f"DEBUG get_current_user_from_token: auth_header_present={'yes' if auth_header else 'no'}"
        # )
        return None
    except Exception as e:
        log_security_event(
            event_type="authentication_error",
            severity="medium",
            details={"error": str(e)},
            ip_address=_get_client_ip(request),
        )
        return None


async def get_current_user(
    request: Request,
    token_user: Optional[CurrentUser] = Depends(get_current_user_from_token),
) -> Optional[CurrentUser]:
    """Get current user from either token"""
    return token_user


async def require_authentication(
    current_user: Optional[CurrentUser] = Depends(get_current_user),
) -> CurrentUser:
    """Require user to be authenticated"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def require_active_user(
    current_user: CurrentUser = Depends(require_authentication),
) -> CurrentUser:
    """Require user to be active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )
    return current_user


async def require_verified_user(
    current_user: CurrentUser = Depends(require_active_user),
) -> CurrentUser:
    """Require user to be verified"""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is not verified"
        )
    return current_user


def require_any_role(*role_names: str) -> callable:
    """Dependency factory for requiring ANY of the given roles"""

    async def role_dependency(
        current_user: CurrentUser = Depends(require_verified_user),
        db: Database = Depends(get_db),
    ) -> CurrentUser:
        user_roles = await RBACCRUD.get_user_roles(db, current_user.id)
        user_role_names = [role["name"] for role in user_roles]

        if not any(role in user_role_names for role in role_names):
            log_security_event(
                event_type="role_access_denied",
                severity="low",
                details={
                    "user_id": str(current_user.id),
                    "required_roles": list(role_names),
                    "user_roles": user_role_names,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of the roles: {', '.join(role_names)}",
            )

        return current_user

    return role_dependency


def require_permissions(
    *required_permissions: str, require_all: bool = True
) -> callable:
    """
    Dependency factory for requiring specific permissions

    Args:
        *required_permissions: Permission strings in format "resource:action"
        require_all: If True, user must have ALL permissions. If False, user needs ANY permission.
    """

    async def permission_dependency(
        current_user: CurrentUser = Depends(require_verified_user),
    ) -> CurrentUser:
        # Superuser/admin override: if user has any admin-level wildcard permission,
        # grant access without evaluating granular checks. This supports roles like
        # "admin:*", "users:*", "roles:*" that indicate broad privileges.
        if getattr(current_user, "is_admin", False):
            return current_user

        if not required_permissions:
            return current_user

        user_has_permissions = []
        for permission in required_permissions:
            if ":" in permission:
                resource, action = permission.split(":", 1)
                has_perm = current_user.has_permission(resource, action)
            else:
                # Assume it's a resource with wildcard action
                has_perm = current_user.has_permission(permission, "*")

            user_has_permissions.append(has_perm)

        if require_all:
            # User must have ALL permissions
            if not all(user_has_permissions):
                missing_perms = [
                    perm
                    for perm, has_perm in zip(
                        required_permissions, user_has_permissions
                    )
                    if not has_perm
                ]
                log_security_event(
                    event_type="permission_denied",
                    severity="low",
                    details={
                        "user_id": str(current_user.id),
                        "required_permissions": list(required_permissions),
                        "missing_permissions": missing_perms,
                    },
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )
        else:
            # User needs ANY permission
            if not any(user_has_permissions):
                log_security_event(
                    event_type="permission_denied",
                    severity="low",
                    details={
                        "user_id": str(current_user.id),
                        "required_permissions": list(required_permissions),
                    },
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions",
                )

        return current_user

    return permission_dependency


def require_role(role_name: str) -> callable:
    """Dependency factory for requiring a specific role"""

    async def role_dependency(
        current_user: CurrentUser = Depends(require_verified_user),
        db: Database = Depends(get_db),
    ) -> CurrentUser:
        user_roles = await RBACCRUD.get_user_roles(db, current_user.id)

        if not any(role["name"] == role_name for role in user_roles):
            log_security_event(
                event_type="role_access_denied",
                severity="low",
                details={
                    "user_id": str(current_user.id),
                    "required_role": role_name,
                    "user_roles": [role["name"] for role in user_roles],
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role_name}' required",
            )

        return current_user

    return role_dependency


def _get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if hasattr(request, "client") and request.client:
        return request.client.host

    return "unknown"


# Common permission dependencies
RequireUserRead = require_permissions("users:read")
RequireUserWrite = require_permissions("users:create", "users:update")
RequireUserDelete = require_permissions("users:delete")
RequireUserManagement = require_permissions("users:*")

RequireRoleManagement = require_permissions("roles:*")
RequirePermissionManagement = require_permissions("permissions:*")

RequireSystemMonitor = require_permissions("system:monitor")
RequireSystemAdmin = require_permissions("system:*")

RequireAdminRole = require_role("admin")
RequireSuperAdminRole = require_role("super_admin")
