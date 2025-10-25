"""
Tests for authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient


@pytest.mark.integration
class TestAuthentication:
    """Test authentication endpoints"""

    def test_login_success(self, client: TestClient, superuser_token_headers: dict):
        """Test successful login with superuser credentials"""
        # The fixture already tests login, so we just verify the token is valid
        assert "Authorization" in superuser_token_headers
        assert superuser_token_headers["Authorization"].startswith("Bearer ")

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/v1/users/login",
            data={
                "username": "invalid@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials"""
        response = client.post("/api/v1/users/login", data={})
        assert response.status_code == 422  # Validation error

    def test_get_current_user(self, client: TestClient, superuser_token_headers: dict):
        """Test getting current user profile"""
        response = client.get(
            "/api/v1/users/me",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data

    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication"""
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_logout(self, client: TestClient, superuser_token_headers: dict):
        """Test logout endpoint"""
        response = client.post(
            "/api/v1/users/logout",
            headers=superuser_token_headers,
        )
        # Logout should succeed or return appropriate status
        assert response.status_code in [200, 204]

    @pytest.mark.skip(reason="Password reset requires email setup")
    def test_password_reset_request(self, client: TestClient):
        """Test password reset request"""
        response = client.post(
            "/api/v1/users/password-reset",
            json={"email": "test@example.com"},
        )
        # Should accept request even if email doesn't exist (security)
        assert response.status_code in [200, 202]


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.skip(reason="Async client tests require database lifespan management")
class TestAuthenticationAsync:
    """Test authentication endpoints with async client"""

    async def test_login_async(self, async_client: AsyncClient):
        """Test async login"""
        from app.config import get_settings

        settings = get_settings()

        response = await async_client.post(
            "/api/v1/users/login",
            data={
                "username": settings.FIRST_SUPERUSER,
                "password": settings.FIRST_SUPERUSER_PASSWORD,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    async def test_get_current_user_async(
        self, async_client: AsyncClient, async_superuser_token_headers: dict
    ):
        """Test getting current user with async client"""
        response = await async_client.get(
            "/api/v1/users/me",
            headers=async_superuser_token_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data


@pytest.mark.unit
class TestAuthenticationValidation:
    """Test authentication input validation"""

    def test_login_email_format(self, client: TestClient):
        """Test login with invalid email format"""
        response = client.post(
            "/api/v1/users/login",
            data={
                "username": "not-an-email",
                "password": "somepassword",
            },
        )
        # Should still attempt login (username can be email or username)
        assert response.status_code in [401, 422]

    def test_login_empty_password(self, client: TestClient):
        """Test login with empty password"""
        response = client.post(
            "/api/v1/users/login",
            data={
                "username": "test@example.com",
                "password": "",
            },
        )
        # OAuth2PasswordRequestForm doesn't validate empty password, just fails auth
        assert response.status_code in [401, 422]  # Auth failure or validation error

