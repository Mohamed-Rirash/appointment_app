"""
User-related test utilities for authentication and user creation.
"""

from typing import Any

from databases import Database
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.config import get_settings
from tests.utils.utils import random_email, random_lower_string

settings = get_settings()


def user_authentication_headers(
    *, client: TestClient, email: str, password: str
) -> dict[str, str]:
    """
    Get authentication headers for a user.

    Args:
        client: FastAPI test client
        email: User email
        password: User password

    Returns:
        Dictionary with Authorization header
    """
    data = {"username": email, "password": password}

    response = client.post("/api/v1/users/login", data=data)

    if response.status_code != 200:
        raise Exception(f"Failed to login user {email}: {response.text}")

    tokens = response.json()
    access_token = tokens["access_token"]

    return {"Authorization": f"Bearer {access_token}"}


async def async_user_authentication_headers(
    *, async_client: AsyncClient, email: str, password: str
) -> dict[str, str]:
    """
    Get authentication headers for a user (async version).

    Args:
        async_client: HTTPX async client
        email: User email
        password: User password

    Returns:
        Dictionary with Authorization header
    """
    data = {"username": email, "password": password}

    response = await async_client.post("/api/v1/users/login", data=data)

    if response.status_code != 200:
        raise Exception(f"Failed to login user {email}: {response.text}")

    tokens = response.json()
    access_token = tokens["access_token"]

    return {"Authorization": f"Bearer {access_token}"}


async def create_test_user(
    db: Database,
    email: str | None = None,
    password: str | None = None,
    role: str = "reception",
) -> dict[str, Any]:
    """
    Create a test user in the database.

    Args:
        db: Database connection
        email: User email (random if not provided)
        password: User password (random if not provided)
        role: User role (default: reception)

    Returns:
        Dictionary with user data including id, email, and password
    """
    import uuid

    from app.auth.models import users
    from app.core.security import get_password_hash

    if email is None:
        email = random_email()
    if password is None:
        password = random_lower_string()

    user_id = uuid.uuid4()
    hashed_password = get_password_hash(password)

    query = users.insert().values(
        id=user_id,
        email=email,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=True,
    )

    await db.execute(query)

    # Assign role if specified
    if role:
        from app.auth.models import roles, user_roles

        # Get role id
        role_query = roles.select().where(roles.c.name == role)
        role_record = await db.fetch_one(role_query)

        if role_record:
            # Assign role to user
            user_role_query = user_roles.insert().values(
                user_id=user_id,
                role_id=role_record["id"],
            )
            await db.execute(user_role_query)

    return {
        "id": str(user_id),
        "email": email,
        "password": password,  # Return plain password for testing
    }
