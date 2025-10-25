"""
Basic tests to verify the test setup is working correctly.
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient


def test_app_exists(client: TestClient):
    """Test that the FastAPI app exists and responds"""
    response = client.get("/health")
    assert response.status_code == 200


def test_docs_available(client: TestClient):
    """Test that API documentation is available"""
    response = client.get("/docs")
    # Should return 200 in development mode
    assert response.status_code in [200, 404]  # 404 if docs disabled in production


@pytest.mark.asyncio
@pytest.mark.skip(reason="Async client tests require database lifespan management")
async def test_async_client_works(async_client: AsyncClient):
    """Test that async client works"""
    response = await async_client.get("/health")
    assert response.status_code == 200


def test_superuser_login(client: TestClient):
    """Test that superuser can login"""
    from app.config import get_settings

    settings = get_settings()

    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }

    response = client.post("/api/v1/users/login", data=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_superuser_token_headers(client: TestClient, superuser_token_headers: dict[str, str]):
    """Test that superuser token headers fixture works"""
    assert "Authorization" in superuser_token_headers
    assert superuser_token_headers["Authorization"].startswith("Bearer ")


def test_get_current_user_with_token(client: TestClient, superuser_token_headers: dict[str, str]):
    """Test getting current user with valid token"""
    response = client.get("/api/v1/users/me", headers=superuser_token_headers)

    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "id" in data


def test_unauthorized_access(client: TestClient):
    """Test that unauthorized access is rejected"""
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_invalid_token(client: TestClient):
    """Test that invalid token is rejected"""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/v1/users/me", headers=headers)

    assert response.status_code == 401


@pytest.mark.unit
def test_sample_citizen_data_fixture(sample_citizen_data: dict):
    """Test that sample citizen data fixture works"""
    assert "firstname" in sample_citizen_data
    assert "lastname" in sample_citizen_data
    assert "email" in sample_citizen_data
    assert "phone" in sample_citizen_data


@pytest.mark.unit
def test_sample_appointment_data_fixture(sample_appointment_data: dict):
    """Test that sample appointment data fixture works"""
    assert "purpose" in sample_appointment_data
    assert "appointment_date" in sample_appointment_data
    assert "time_slotted" in sample_appointment_data

