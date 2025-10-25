"""
Test utility functions for generating random data and authentication.
"""

import random
import string

from fastapi.testclient import TestClient

from app.config import get_settings

settings = get_settings()


def random_lower_string(length: int = 32) -> str:
    """Generate a random lowercase string"""
    return "".join(random.choices(string.ascii_lowercase, k=length))


def random_email() -> str:
    """Generate a random email address"""
    return f"{random_lower_string(10)}@{random_lower_string(8)}.com"


def random_phone() -> str:
    """Generate a random phone number"""
    return f"+1{''.join(random.choices(string.digits, k=10))}"


def get_superuser_token_headers(client: TestClient) -> dict[str, str]:
    """
    Get authentication headers for superuser.

    Args:
        client: FastAPI test client

    Returns:
        Dictionary with Authorization header
    """
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }

    response = client.post("/api/v1/users/login", data=login_data)

    if response.status_code != 200:
        raise Exception(f"Failed to login as superuser: {response.text}")

    tokens = response.json()
    access_token = tokens["access_token"]

    return {"Authorization": f"Bearer {access_token}"}
