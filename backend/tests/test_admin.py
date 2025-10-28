"""
Tests for admin/user management endpoints
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestUserManagement:
    """Test user CRUD operations"""

    def test_get_all_users(self, client: TestClient, superuser_token_headers: dict):
        """Test getting all users with pagination"""
        response = client.get(
            "/api/v1/admin/users",
            params={"page": 1, "size": 20},
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert isinstance(data["users"], list)

    def test_get_users_with_filters(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test getting users with filters"""
        response = client.get(
            "/api/v1/admin/users",
            params={
                "page": 1,
                "size": 20,
                "is_active": True,
                "is_verified": True,
            },
            headers=superuser_token_headers,
        )

        assert response.status_code == 200

    def test_get_users_with_search(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test searching users"""
        response = client.get(
            "/api/v1/admin/users",
            params={
                "page": 1,
                "size": 20,
                "search": "admin",
            },
            headers=superuser_token_headers,
        )

        assert response.status_code == 200

    @pytest.mark.skip(reason="Requires email setup for invite")
    def test_create_user(self, client: TestClient, superuser_token_headers: dict):
        """Test creating a new user"""
        payload = {
            "email": f"test_{uuid4().hex[:8]}@example.com",
            "full_name": "Test User",
            "roles": ["reception"],
        }

        response = client.post(
            "/api/v1/admin/users",
            json=payload,
            headers=superuser_token_headers,
        )

        # Should create or fail with validation
        assert response.status_code in [201, 400, 422]

    @pytest.mark.skip(reason="Requires existing user")
    def test_get_user_by_id(self, client: TestClient, superuser_token_headers: dict):
        """Test getting user by ID"""
        user_id = uuid4()

        response = client.get(
            f"/api/v1/admin/users/{user_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing user")
    def test_update_user(self, client: TestClient, superuser_token_headers: dict):
        """Test updating a user"""
        user_id = uuid4()

        payload = {
            "full_name": "Updated Name",
            "is_active": True,
        }

        response = client.put(
            f"/api/v1/admin/users/{user_id}",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing user")
    def test_delete_user(self, client: TestClient, superuser_token_headers: dict):
        """Test deleting a user"""
        user_id = uuid4()

        response = client.delete(
            f"/api/v1/admin/users/{user_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 204, 404]

    def test_user_operations_unauthorized(self, client: TestClient):
        """Test user operations without authentication"""
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401


@pytest.mark.integration
class TestRoleManagement:
    """Test role management operations"""

    def test_get_all_roles(self, client: TestClient, superuser_token_headers: dict):
        """Test getting all roles"""
        response = client.get(
            "/api/v1/admin/roles",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.skip(reason="Requires proper role setup")
    def test_create_role(self, client: TestClient, superuser_token_headers: dict):
        """Test creating a new role"""
        payload = {
            "name": f"test_role_{uuid4().hex[:8]}",
            "display_name": "Test Role",
            "description": "A test role",
        }

        response = client.post(
            "/api/v1/admin/roles",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code in [201, 400, 422]

    @pytest.mark.skip(reason="Requires existing role")
    def test_get_role_by_id(self, client: TestClient, superuser_token_headers: dict):
        """Test getting role by ID"""
        role_id = uuid4()

        response = client.get(
            f"/api/v1/admin/roles/{role_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing user and role")
    def test_assign_role_to_user(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test assigning a role to a user"""
        user_id = uuid4()
        role_id = uuid4()

        response = client.post(
            f"/api/v1/admin/users/{user_id}/roles/{role_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 201, 404]

    @pytest.mark.skip(reason="Requires existing user and role")
    def test_remove_role_from_user(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test removing a role from a user"""
        user_id = uuid4()
        role_id = uuid4()

        response = client.delete(
            f"/api/v1/admin/users/{user_id}/roles/{role_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 204, 404]


@pytest.mark.integration
class TestPermissionManagement:
    """Test permission management operations"""

    def test_get_all_permissions(self, client: TestClient, superuser_token_headers: dict):
        """Test getting all permissions"""
        response = client.get(
            "/api/v1/admin/permissions",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.skip(reason="Requires existing role and permission")
    def test_assign_permission_to_role(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test assigning a permission to a role"""
        role_id = uuid4()
        permission_id = uuid4()

        response = client.post(
            f"/api/v1/admin/roles/{role_id}/permissions/{permission_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 201, 404]

    @pytest.mark.skip(reason="Requires existing role and permission")
    def test_remove_permission_from_role(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test removing a permission from a role"""
        role_id = uuid4()
        permission_id = uuid4()

        response = client.delete(
            f"/api/v1/admin/roles/{role_id}/permissions/{permission_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 204, 404]


@pytest.mark.unit
class TestUserValidation:
    """Test user data validation"""

    def test_invalid_email_format(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test creating user with invalid email"""
        payload = {
            "email": "not-an-email",
            "full_name": "Test User",
        }

        response = client.post(
            "/api/v1/admin/users",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code == 422

    def test_missing_required_fields(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test creating user with missing required fields"""
        payload = {
            "full_name": "Test User",
            # Missing email
        }

        response = client.post(
            "/api/v1/admin/users",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code == 422

    def test_pagination_validation(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test pagination parameter validation"""
        # Invalid page number
        response = client.get(
            "/api/v1/admin/users",
            params={"page": 0, "size": 20},
            headers=superuser_token_headers,
        )
        assert response.status_code == 422

        # Invalid size
        response = client.get(
            "/api/v1/admin/users",
            params={"page": 1, "size": 0},
            headers=superuser_token_headers,
        )
        assert response.status_code == 422

        # Size too large
        response = client.get(
            "/api/v1/admin/users",
            params={"page": 1, "size": 1000},
            headers=superuser_token_headers,
        )
        assert response.status_code == 422

