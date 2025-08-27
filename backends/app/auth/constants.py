# Constants for authentication
from app.config import get_settings

settings = get_settings()
SQLALCHEMY_DATABASE_URI = str(settings.SQLALCHEMY_DATABASE_URI)


USER_VERIFY_ACCOUNT = "verify-account"
FORGOT_PASSWORD = "password-reset"
USER_INVITE = "user-invite"


# --- Define default roles ---
DEFAULT_ROLES = [
    {
        "name": "admin",
        "display_name": "Administrator",
        "description": "System administrator with full access",
        "is_system": True,
    },
    {
        "name": "reception",
        "display_name": "Reception",
        "description": "Reception staff handling appointment scheduling",
    },
    {
        "name": "secretary",
        "display_name": "Secretary",
        "description": "Secretary handling appointments and approvals",
    },
    {
        "name": "host",
        "display_name": "Host (Minister/Officer)",
        "description": "Government officer hosting appointments",
    },
]

# --- Default role-permission mapping ---
DEFAULT_ROLE_PERMISSIONS = {
    "admin": "*",  # all permissions
    "reception": [
        "appointments:create",
        "appointments:list",
        "appointments:read",
    ],
    "secretary": [
        "appointments:*",  # full appointment control
    ],
    "host": [
        "appointments:read",
        "appointments:approve",
        "appointments:deny",
        "appointments:postpone",
        "appointments:list",
    ],
}
