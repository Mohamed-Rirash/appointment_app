# Utility functions for authentication
import secrets


def get_context_string(row: dict, context: str) -> str:
    """Generate a context string using the last 6 characters of password and updated_at."""
    password_part = row["password"][-6:] if row.get("password") else ""
    updated_at_part = (
        row["updated_at"].strftime("%m%d%Y%H%M%S") if row.get("updated_at") else ""
    )
    return f"{context}{password_part}{updated_at_part}".strip()


def unique_string(byte: int = 8) -> str:
    return secrets.token_urlsafe(byte)
