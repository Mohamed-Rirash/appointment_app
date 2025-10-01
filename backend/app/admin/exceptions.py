"""
Admin module specific exceptions
"""

from typing import Any, Dict, Optional, List

from fastapi import status


class AdminException(Exception):
    """Base admin exception (framework-agnostic)."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.context = context or {}


class AdminValidationError(AdminException):
    """Validation error with optional field-level details"""

    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=message,
            error_code="VALIDATION_ERROR",
            context={"details": details or []},
        )


class UserAlreadyExistsError(AdminException):
    """Raised when attempting to create a user with an existing email"""

    def __init__(self, email: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with this email already exists",
            error_code="USER_ALREADY_EXISTS",
            context={"email": email},
        )


class RolesMissingError(AdminException):
    """Raised when one or more roles provided do not exist"""

    def __init__(self, missing_roles: List[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more roles do not exist",
            error_code="ROLES_MISSING",
            context={"missing_roles": missing_roles},
        )


class InsufficientPermissionsError(AdminException):
    """Raised when user lacks required admin permissions"""

    def __init__(
        self,
        required_permission: str,
        user_permissions: Optional[list] = None,
        detail: Optional[str] = None,
    ):
        if not detail:
            detail = f"Insufficient permissions. Required: {required_permission}"

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="INSUFFICIENT_PERMISSIONS",
            context={
                "required_permission": required_permission,
                "user_permissions": user_permissions or [],
            },
        )


class AdminOnlyError(AdminException):
    """Raised when operation requires admin access"""

    def __init__(self, detail: str = "Admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="ADMIN_ONLY",
        )


class SuperAdminOnlyError(AdminException):
    """Raised when operation requires super admin access"""

    def __init__(self, detail: str = "Super admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SUPER_ADMIN_ONLY",
        )


class SystemAdminOnlyError(AdminException):
    """Raised when operation requires system admin access"""

    def __init__(self, detail: str = "System admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SYSTEM_ADMIN_ONLY",
        )


class UserNotFoundError(AdminException):
    """Raised when user is not found"""

    def __init__(self, user_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"User with ID {user_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="USER_NOT_FOUND",
            context={"user_id": user_id},
        )


class RoleNotFoundError(AdminException):
    """Raised when role is not found"""

    def __init__(self, role_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Role with ID {role_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="ROLE_NOT_FOUND",
            context={"role_id": role_id},
        )


class PermissionNotFoundError(AdminException):
    """Raised when permission is not found"""

    def __init__(self, permission_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Permission with ID {permission_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="PERMISSION_NOT_FOUND",
            context={"permission_id": permission_id},
        )


class SystemUserProtectedError(AdminException):
    """Raised when trying to modify protected system users"""

    def __init__(self, user_email: str, operation: str):
        detail = f"Cannot {operation} system user: {user_email}"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SYSTEM_USER_PROTECTED",
            context={"user_email": user_email, "operation": operation},
        )


class BulkOperationError(AdminException):
    """Raised when bulk operation fails"""

    def __init__(
        self,
        operation: str,
        total_appointments: int,
        failed_appointments: int,
        errors: Optional[list] = None,
    ):
        detail = f"Bulk {operation} failed: {failed_appointments}/{total_appointments} appointments failed"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BULK_OPERATION_ERROR",
            context={
                "operation": operation,
                "total_appointments": total_appointments,
                "failed_appointments": failed_appointments,
                "errors": errors or [],
            },
        )


class InvalidBulkOperationError(AdminException):
    """Raised when bulk operation parameters are invalid"""

    def __init__(self, detail: str, max_allowed: Optional[int] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_BULK_OPERATION",
            context={"max_allowed": max_allowed} if max_allowed else {},
        )


class AdminActionNotAllowedError(AdminException):
    """Raised when admin action is not allowed"""

    def __init__(self, action: str, reason: str):
        detail = f"Action '{action}' not allowed: {reason}"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="ADMIN_ACTION_NOT_ALLOWED",
            context={"action": action, "reason": reason},
        )


class SelfModificationError(AdminException):
    """Raised when admin tries to modify their own account in forbidden ways"""

    def __init__(self, action: str):
        detail = f"Cannot {action} your own account"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SELF_MODIFICATION_ERROR",
            context={"action": action},
        )


class RoleAssignmentError(AdminException):
    """Raised when role assignment fails"""

    def __init__(self, user_id: str, role_id: str, reason: str):
        detail = f"Cannot assign role: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="ROLE_ASSIGNMENT_ERROR",
            context={"user_id": user_id, "role_id": role_id, "reason": reason},
        )


class SystemMaintenanceError(AdminException):
    """Raised when system is in maintenance mode"""

    def __init__(self, detail: str = "System is currently in maintenance mode"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_code="SYSTEM_MAINTENANCE",
        )


class ExportError(AdminException):
    """Raised when data export fails"""

    def __init__(self, export_type: str, reason: str):
        detail = f"Export failed for {export_type}: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="EXPORT_ERROR",
            context={"export_type": export_type, "reason": reason},
        )


"""
Admin module specific exceptions
"""

from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class AdminException(HTTPException):
    """Base admin exception"""

    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.context = context or {}


class InsufficientPermissionsError(AdminException):
    """Raised when user lacks required admin permissions"""

    def __init__(
        self,
        required_permission: str,
        user_permissions: Optional[list] = None,
        detail: Optional[str] = None,
    ):
        if not detail:
            detail = f"Insufficient permissions. Required: {required_permission}"

        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="INSUFFICIENT_PERMISSIONS",
            context={
                "required_permission": required_permission,
                "user_permissions": user_permissions or [],
            },
        )


class AdminOnlyError(AdminException):
    """Raised when operation requires admin access"""

    def __init__(self, detail: str = "Admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="ADMIN_ONLY",
        )


class SuperAdminOnlyError(AdminException):
    """Raised when operation requires super admin access"""

    def __init__(self, detail: str = "Super admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SUPER_ADMIN_ONLY",
        )


class SystemAdminOnlyError(AdminException):
    """Raised when operation requires system admin access"""

    def __init__(self, detail: str = "System admin access required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SYSTEM_ADMIN_ONLY",
        )


class UserNotFoundError(AdminException):
    """Raised when user is not found"""

    def __init__(self, user_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"User with ID {user_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="USER_NOT_FOUND",
            context={"user_id": user_id},
        )


class RoleNotFoundError(AdminException):
    """Raised when role is not found"""

    def __init__(self, role_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Role with ID {role_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="ROLE_NOT_FOUND",
            context={"role_id": role_id},
        )


class PermissionNotFoundError(AdminException):
    """Raised when permission is not found"""

    def __init__(self, permission_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Permission with ID {permission_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="PERMISSION_NOT_FOUND",
            context={"permission_id": permission_id},
        )


class SystemUserProtectedError(AdminException):
    """Raised when trying to modify protected system users"""

    def __init__(self, user_email: str, operation: str):
        detail = f"Cannot {operation} system user: {user_email}"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SYSTEM_USER_PROTECTED",
            context={"user_email": user_email, "operation": operation},
        )


class BulkOperationError(AdminException):
    """Raised when bulk operation fails"""

    def __init__(
        self,
        operation: str,
        total_appointments: int,
        failed_appointments: int,
        errors: Optional[list] = None,
    ):
        detail = f"Bulk {operation} failed: {failed_appointments}/{total_appointments} appointments failed"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BULK_OPERATION_ERROR",
            context={
                "operation": operation,
                "total_appointments": total_appointments,
                "failed_appointments": failed_appointments,
                "errors": errors or [],
            },
        )


class InvalidBulkOperationError(AdminException):
    """Raised when bulk operation parameters are invalid"""

    def __init__(self, detail: str, max_allowed: Optional[int] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_BULK_OPERATION",
            context={"max_allowed": max_allowed} if max_allowed else {},
        )


class AdminActionNotAllowedError(AdminException):
    """Raised when admin action is not allowed"""

    def __init__(self, action: str, reason: str):
        detail = f"Action '{action}' not allowed: {reason}"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="ADMIN_ACTION_NOT_ALLOWED",
            context={"action": action, "reason": reason},
        )


class SelfModificationError(AdminException):
    """Raised when admin tries to modify their own account in forbidden ways"""

    def __init__(self, action: str):
        detail = f"Cannot {action} your own account"
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="SELF_MODIFICATION_ERROR",
            context={"action": action},
        )


class RoleAssignmentError(AdminException):
    """Raised when role assignment fails"""

    def __init__(self, user_id: str, role_id: str, reason: str):
        detail = f"Cannot assign role: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="ROLE_ASSIGNMENT_ERROR",
            context={"user_id": user_id, "role_id": role_id, "reason": reason},
        )


class SystemMaintenanceError(AdminException):
    """Raised when system is in maintenance mode"""

    def __init__(self, detail: str = "System is currently in maintenance mode"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_code="SYSTEM_MAINTENANCE",
        )


class ExportError(AdminException):
    """Raised when data export fails"""

    def __init__(self, export_type: str, reason: str):
        detail = f"Export failed for {export_type}: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="EXPORT_ERROR",
            context={"export_type": export_type, "reason": reason},
        )


class AuditLogError(AdminException):
    """Raised when audit logging fails"""

    def __init__(self, action: str, reason: str):
        detail = f"Audit logging failed for action '{action}': {reason}"
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="AUDIT_LOG_ERROR",
            context={"action": action, "reason": reason},
        )


# Office Management Exceptions
class OfficeNotFoundError(AdminException):
    """Raised when office is not found"""

    def __init__(self, office_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Office with ID {office_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="OFFICE_NOT_FOUND",
            context={"office_id": office_id},
        )


class OfficeAlreadyExistsError(AdminException):
    """Raised when trying to create an office that already exists"""

    def __init__(self, office_name: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Office with name '{office_name}' already exists"

        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="OFFICE_ALREADY_EXISTS",
            context={"office_name": office_name},
        )


class InvalidOfficeDataError(AdminException):
    """Raised when office data is invalid"""

    def __init__(self, field: str, reason: str, value: Optional[str] = None):
        detail = f"Invalid office data for field '{field}': {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_OFFICE_DATA",
            context={"field": field, "reason": reason, "value": value},
        )


class HostNotFoundError(AdminException):
    """Raised when host is not found"""

    def __init__(self, host_id: str, detail: Optional[str] = None):
        if not detail:
            detail = f"Host with ID {host_id} not found"

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="HOST_NOT_FOUND",
            context={"host_id": host_id},
        )


class HostAlreadyAssignedError(AdminException):
    """Raised when host is already assigned to an office"""

    def __init__(self, host_id: str, office_id: str):
        detail = f"Host {host_id} is already assigned to office {office_id}"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="HOST_ALREADY_ASSIGNED",
            context={"host_id": host_id, "office_id": office_id},
        )


class HostAssignmentError(AdminException):
    """Raised when host assignment fails"""

    def __init__(self, host_id: str, office_id: str, reason: str):
        detail = f"Cannot assign host to office: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="HOST_ASSIGNMENT_ERROR",
            context={"host_id": host_id, "office_id": office_id, "reason": reason},
        )


class OfficeMembershipError(AdminException):
    """Raised when office membership operation fails"""

    def __init__(self, user_id: str, office_id: str, reason: str):
        detail = f"Office membership operation failed: {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="OFFICE_MEMBERSHIP_ERROR",
            context={"user_id": user_id, "office_id": office_id, "reason": reason},
        )


class InvalidMembershipDataError(AdminException):
    """Raised when membership data is invalid"""

    def __init__(self, field: str, reason: str, value: Optional[str] = None):
        detail = f"Invalid membership data for field '{field}': {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_MEMBERSHIP_DATA",
            context={"field": field, "reason": reason, "value": value},
        )


class DuplicateMembershipError(AdminException):
    """Raised when user is already a member of the office"""

    def __init__(self, user_id: str, office_id: str):
        detail = f"User {user_id} is already a member of office {office_id}"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="DUPLICATE_MEMBERSHIP",
            context={"user_id": user_id, "office_id": office_id},
        )


class PrimaryContactRequiredError(AdminException):
    """Raised when trying to remove the primary contact without assigning a new one"""

    def __init__(self, office_id: str):
        detail = f"Cannot remove primary contact from office {office_id} without assigning a replacement"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="PRIMARY_CONTACT_REQUIRED",
            context={"office_id": office_id},
        )
