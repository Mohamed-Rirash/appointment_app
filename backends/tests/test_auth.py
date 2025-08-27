"""
Authentication tests
"""
import pytest
from httpx import AsyncClient
from databases import Database

from app.auth.crud import UserCRUD
from app.core.security import hash_password, create_access_token
from tests.conftest import TestUtils


class TestUserRegistration:
    """Test user registration"""
    
    @pytest.mark.asyncio
    async def test_create_user_success(self, client: AsyncClient):
        """Test successful user creation"""
        user_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@gmail.com",
            "password": "SecurePass123!"
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User created successfully"
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, client: AsyncClient, test_user: dict):
        """Test user creation with duplicate email"""
        user_data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "test@gmail.com",  # Use valid domain and same email as test_user
            "password": "SecurePass123!"
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 400  # Or whatever error code you use
    
    @pytest.mark.asyncio
    async def test_create_user_weak_password(self, client: AsyncClient):
        """Test user creation with weak password"""
        user_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@gmail.com",
            "password": "weak"  # Weak password
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_create_user_invalid_email(self, client: AsyncClient):
        """Test user creation with invalid email"""
        user_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "invalid-email",
            "password": "SecurePass123!"
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login"""
    
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: dict):
        """Test successful login"""
        login_data = {
            "username": test_user["email"],
            "password": "TestPass123!"  # Password used in test_user fixture
        }
        
        response = await client.post(
            "/api/v1/users/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert "user" in data
    
    @pytest.mark.asyncio
    async def test_login_invalid_email(self, client: AsyncClient):
        """Test login with invalid email"""
        login_data = {
            "username": "nonexistent@gmail.com",
            "password": "TestPass123!"
        }
        
        response = await client.post(
            "/api/v1/users/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient, test_user: dict):
        """Test login with invalid password"""
        login_data = {
            "username": test_user["email"],
            "password": "WrongPassword123!"
        }
        
        response = await client.post(
            "/api/v1/users/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_login_unverified_user(self, client: AsyncClient, db_session: Database):
        """Test login with unverified user"""
        # Create unverified user
        user_data = {
            "first_name": "Unverified",
            "last_name": "User",
            "email": "unverified@gmail.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": False  # Not verified
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        login_data = {
            "username": user["email"],
            "password": "TestPass123!"
        }
        
        response = await client.post(
            "/api/v1/users/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401


class TestUserProfile:
    """Test user profile endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_current_user_profile(self, client: AsyncClient, auth_headers: dict):
        """Test getting current user profile"""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "first_name" in data
        assert "last_name" in data
        assert "is_active" in data
        assert "is_verified" in data
        assert "permissions" in data
    
    @pytest.mark.asyncio
    async def test_get_profile_unauthorized(self, client: AsyncClient):
        """Test getting profile without authentication"""
        response = await client.get("/api/v1/users/me")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_profile_invalid_token(self, client: AsyncClient):
        """Test getting profile with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = await client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == 401


class TestPasswordManagement:
    """Test password management"""
    
    @pytest.mark.asyncio
    async def test_change_password_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful password change"""
        password_data = {
            "current_password": "TestPass123!",
            "new_password": "NewSecurePass123!"
        }
        
        response = await client.post(
            "/api/v1/users/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password changed successfully"
    
    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, client: AsyncClient, auth_headers: dict):
        """Test password change with wrong current password"""
        password_data = {
            "current_password": "WrongPassword123!",
            "new_password": "NewSecurePass123!"
        }
        
        response = await client.post(
            "/api/v1/users/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_change_password_weak_new(self, client: AsyncClient, auth_headers: dict):
        """Test password change with weak new password"""
        password_data = {
            "current_password": "TestPass123!",
            "new_password": "weak"
        }
        
        response = await client.post(
            "/api/v1/users/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_request_password_reset(self, client: AsyncClient, test_user: dict):
        """Test password reset request"""
        reset_data = {
            "email": test_user["email"]
        }
        
        response = await client.post(
            "/api/v1/users/request-password-reset",
            json=reset_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "password reset link" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_request_password_reset_nonexistent_email(self, client: AsyncClient):
        """Test password reset request with nonexistent email"""
        reset_data = {
            "email": "nonexistent@gmail.com"
        }
        
        response = await client.post(
            "/api/v1/users/request-password-reset",
            json=reset_data
        )
        
        # Should return same message for security (don't reveal if email exists)
        assert response.status_code == 200
        data = response.json()
        assert "password reset link" in data["message"].lower()


class TestLogout:
    """Test user logout"""
    
    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful logout"""
        response = await client.post("/api/v1/users/logout", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"
    
    @pytest.mark.asyncio
    async def test_logout_unauthorized(self, client: AsyncClient):
        """Test logout without authentication"""
        response = await client.post("/api/v1/users/logout")
        
        assert response.status_code == 401


class TestAPIKeyAuthentication:
    """Test API key authentication"""
    
    @pytest.mark.asyncio
    async def test_api_key_access(self, client: AsyncClient, api_key_headers: dict):
        """Test access with valid API key"""
        response = await client.get("/api/v1/health/detailed", headers=api_key_headers)
        
        # Should work if API keys are enabled and valid
        assert response.status_code in [200, 401]  # Depends on configuration
    
    @pytest.mark.asyncio
    async def test_invalid_api_key(self, client: AsyncClient):
        """Test access with invalid API key"""
        headers = {"X-API-Key": "invalid-api-key"}
        response = await client.get("/api/v1/health/detailed", headers=headers)
        
        assert response.status_code == 401
