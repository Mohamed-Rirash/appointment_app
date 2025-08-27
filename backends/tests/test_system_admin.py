"""
Tests for system admin protection functionality
"""
import pytest
from httpx import AsyncClient
from databases import Database
from uuid import UUID

from app.auth.crud import UserCRUD
from app.core.security import hash_password
from tests.conftest import TestUtils


class TestSystemAdminProtection:
    """Test system admin protection features"""
    
    @pytest.mark.asyncio
    async def test_create_system_user(self, db_session: Database):
        """Test creating a system user"""
        user_data = {
            "first_name": "System",
            "last_name": "Admin",
            "email": "system.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        assert user is not None
        assert user["is_system_user"] is True
        assert user["email"] == "system.test@example.com"
    
    @pytest.mark.asyncio
    async def test_system_user_cannot_be_deleted(self, db_session: Database):
        """Test that system users cannot be deleted"""
        # Create system user
        user_data = {
            "first_name": "System",
            "last_name": "User",
            "email": "system.delete.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Try to delete system user - should raise ValueError
        with pytest.raises(ValueError, match="System users cannot be deleted"):
            await UserCRUD.delete(db_session, user["id"])
    
    @pytest.mark.asyncio
    async def test_regular_user_can_be_deleted(self, db_session: Database):
        """Test that regular users can be deleted"""
        # Create regular user
        user_data = {
            "first_name": "Regular",
            "last_name": "User",
            "email": "regular.delete.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Delete regular user - should work
        await UserCRUD.delete(db_session, user["id"])
        
        # Verify user is deleted
        deleted_user = await UserCRUD.get_by_id(db_session, user["id"])
        assert deleted_user is None
    
    @pytest.mark.asyncio
    async def test_admin_cannot_delete_system_user_via_api(
        self, 
        client: AsyncClient, 
        admin_auth_headers: dict,
        db_session: Database
    ):
        """Test that admin cannot delete system user via API"""
        # Create system user
        user_data = {
            "first_name": "System",
            "last_name": "API Test",
            "email": "system.api.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Try to delete via API
        response = await client.delete(
            f"/api/v1/admin/users/{user['id']}", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "System users cannot be deleted" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_admin_cannot_deactivate_system_user_via_api(
        self, 
        client: AsyncClient, 
        admin_auth_headers: dict,
        db_session: Database
    ):
        """Test that admin cannot deactivate system user via API"""
        # Create system user
        user_data = {
            "first_name": "System",
            "last_name": "Deactivate Test",
            "email": "system.deactivate.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Try to deactivate via API
        response = await client.patch(
            f"/api/v1/admin/users/{user['id']}/deactivate", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "System users cannot be deactivated" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_admin_can_manage_regular_users(
        self, 
        client: AsyncClient, 
        admin_auth_headers: dict,
        db_session: Database
    ):
        """Test that admin can manage regular users"""
        # Create regular user
        user_data = {
            "first_name": "Regular",
            "last_name": "Manage Test",
            "email": "regular.manage.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Deactivate regular user - should work
        response = await client.patch(
            f"/api/v1/admin/users/{user['id']}/deactivate", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        
        # Activate regular user - should work
        response = await client.patch(
            f"/api/v1/admin/users/{user['id']}/activate", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        
        # Delete regular user - should work
        response = await client.delete(
            f"/api/v1/admin/users/{user['id']}", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_system_info_endpoint_shows_system_users(
        self, 
        client: AsyncClient, 
        admin_auth_headers: dict,
        db_session: Database
    ):
        """Test that system info endpoint shows system users"""
        # Create system user
        user_data = {
            "first_name": "System",
            "last_name": "Info Test",
            "email": "system.info.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        await UserCRUD.create(db_session, user_data)
        
        # Get system info
        response = await client.get(
            "/api/v1/admin/system/info", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "system_users_count" in data
        assert "system_users" in data
        assert data["system_users_count"] >= 1
        
        # Check if our test system user is in the list
        system_users = data["system_users"]
        test_user_found = any(
            user["email"] == "system.info.test@example.com" 
            for user in system_users
        )
        assert test_user_found
    
    @pytest.mark.asyncio
    async def test_cannot_remove_super_admin_role_from_system_user(
        self, 
        client: AsyncClient, 
        admin_auth_headers: dict,
        db_session: Database
    ):
        """Test that super_admin role cannot be removed from system users"""
        from app.auth.rbac import RoleCRUD, RBACCRUD
        
        # Create system user
        user_data = {
            "first_name": "System",
            "last_name": "Role Test",
            "email": "system.role.test@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": True
        }
        
        user = await UserCRUD.create(db_session, user_data)
        
        # Get super_admin role
        super_admin_role = await RoleCRUD.get_by_name(db_session, "super_admin")
        if not super_admin_role:
            # Create super_admin role for test
            role_data = {
                "name": "super_admin",
                "display_name": "Super Administrator",
                "description": "System super admin",
                "is_system": True
            }
            super_admin_role = await RoleCRUD.create(db_session, role_data, created_by=user["id"])
        
        # Assign super_admin role
        await RBACCRUD.assign_role_to_user(
            db_session, user["id"], super_admin_role["id"], assigned_by=user["id"]
        )
        
        # Try to remove super_admin role from system user
        response = await client.delete(
            f"/api/v1/admin/users/{user['id']}/roles/{super_admin_role['id']}", 
            headers=admin_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Cannot remove super_admin role from system users" in data["detail"]
