"""
Comprehensive tests for admin module functionality
"""
import pytest
from httpx import AsyncClient
from databases import Database
from uuid import UUID, uuid4

from app.auth.crud import UserCRUD
from app.auth.rbac import RoleCRUD, RBACCRUD
from app.core.security import hash_password
from app.admin.service import AdminUserService, AdminSystemService
from app.admin.schemas import AdminUserCreate, AdminUserUpdate, BulkUserOperation, PaginationParams
from app.admin.crud import AdminAuditCRUD, AdminSystemCRUD
from app.admin.config import AdminPermissions
from tests.conftest import TestUtils


class TestAdminUserManagement:
    """Test admin user management functionality"""
    
    @pytest.mark.asyncio
    async def test_admin_create_user(self, db_session: Database, super_admin_user: dict):
        """Test admin user creation"""
        
        user_data = AdminUserCreate(
            first_name="Test",
            last_name="Admin User",
            email="test.admin@gmail.com",
            password="AdminPass123!",
            is_active=True,
            is_verified=True,
            send_welcome_email=False
        )
        
        created_user = await AdminUserService.create_user(
            db_session, user_data, super_admin_user["id"]
        )
        
        assert created_user["email"] == "test.admin@gmail.com"
        assert created_user["first_name"] == "Test"
        assert created_user["is_active"] is True
        assert created_user["is_verified"] is True
    
    @pytest.mark.asyncio
    async def test_admin_update_user(self, db_session: Database, test_user: dict, super_admin_user: dict):
        """Test admin user update"""
        
        update_data = AdminUserUpdate(
            first_name="Updated",
            is_verified=True
        )
        
        updated_user = await AdminUserService.update_user(
            db_session, test_user["id"], update_data, super_admin_user["id"]
        )
        
        assert updated_user["first_name"] == "Updated"
        assert updated_user["is_verified"] is True
    
    @pytest.mark.asyncio
    async def test_admin_delete_user(self, db_session: Database, super_admin_user: dict):
        """Test admin user deletion"""
        
        # Create user to delete
        user_data = {
            "first_name": "Delete",
            "last_name": "Me",
            "email": "delete.me@gmail.com",
            "password": await hash_password("TempPass123!"),
            "is_active": True,
            "is_verified": False,
            "is_system_user": False
        }
        
        created_user = await UserCRUD.create(db_session, user_data)
        
        # Delete user
        result = await AdminUserService.delete_user(
            db_session, created_user["id"], super_admin_user["id"]
        )
        
        assert result is True
        
        # Verify user is deactivated (soft delete)
        deleted_user = await UserCRUD.get_by_id(db_session, created_user["id"])
        assert deleted_user["is_active"] is False
    
    @pytest.mark.asyncio
    async def test_bulk_user_operations(self, db_session: Database, super_admin_user: dict):
        """Test bulk user operations"""
        
        # Create multiple users
        user_ids = []
        for i in range(3):
            user_data = {
                "first_name": f"Bulk{i}",
                "last_name": "User",
                "email": f"bulk{i}@gmail.com",
                "password": await hash_password("BulkPass123!"),
                "is_active": False,
                "is_verified": False,
                "is_system_user": False
            }
            user = await UserCRUD.create(db_session, user_data)
            user_ids.append(user["id"])
        
        # Perform bulk activation
        bulk_operation = BulkUserOperation(
            user_ids=user_ids,
            operation="activate"
        )
        
        result = await AdminUserService.bulk_operation(
            db_session, bulk_operation, super_admin_user["id"]
        )
        
        assert result.total_items == 3
        assert result.successful_items == 3
        assert result.failed_items == 0
        
        # Verify users are activated
        for user_id in user_ids:
            user = await UserCRUD.get_by_id(db_session, user_id)
            assert user["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_role_assignment(self, db_session: Database, test_user: dict, super_admin_user: dict):
        """Test role assignment to user"""
        
        # Create a test role
        role_data = {
            "name": "test_role",
            "display_name": "Test Role",
            "description": "Test role for assignment",
            "is_active": True,
            "is_system": False
        }
        role = await RoleCRUD.create(db_session, role_data, super_admin_user["id"])
        
        # Assign role
        result = await AdminUserService.assign_role(
            db_session, test_user["id"], role["id"], super_admin_user["id"]
        )
        
        assert result is True
        
        # Verify role assignment
        user_roles = await RBACCRUD.get_user_roles(db_session, test_user["id"])
        role_names = [r["name"] for r in user_roles]
        assert "test_role" in role_names
    
    @pytest.mark.asyncio
    async def test_system_user_protection(self, db_session: Database, system_admin_user: dict, super_admin_user: dict):
        """Test that system users are protected from deletion"""
        
        with pytest.raises(ValueError, match="System users cannot be deleted"):
            await AdminUserService.delete_user(
                db_session, system_admin_user["id"], super_admin_user["id"]
            )


class TestAdminSystemMonitoring:
    """Test admin system monitoring functionality"""
    
    @pytest.mark.asyncio
    async def test_get_system_stats(self, db_session: Database):
        """Test system statistics retrieval"""
        
        stats = await AdminSystemService.get_system_stats(db_session)
        
        assert hasattr(stats, 'total_users')
        assert hasattr(stats, 'active_users')
        assert hasattr(stats, 'total_roles')
        assert hasattr(stats, 'total_permissions')
        assert stats.total_users >= 0
        assert stats.active_users >= 0
    
    @pytest.mark.asyncio
    async def test_get_dashboard_data(self, db_session: Database, super_admin_user: dict):
        """Test dashboard data retrieval"""
        
        dashboard_data = await AdminSystemService.get_dashboard_data(
            db_session, super_admin_user["id"]
        )
        
        assert "system_stats" in dashboard_data
        assert "user_analytics" in dashboard_data
        assert "recent_activities" in dashboard_data
        assert "quick_actions" in dashboard_data
        
        # Verify quick actions structure
        quick_actions = dashboard_data["quick_actions"]
        assert len(quick_actions) > 0
        assert all("name" in action and "url" in action for action in quick_actions)


class TestAdminAuditLogging:
    """Test admin audit logging functionality"""
    
    @pytest.mark.asyncio
    async def test_audit_log_creation(self, db_session: Database, super_admin_user: dict):
        """Test audit log creation"""
        
        from app.admin.schemas import AdminActionType
        
        log_id = await AdminAuditCRUD.create_audit_log(
            db=db_session,
            admin_id=super_admin_user["id"],
            action=AdminActionType.CREATE,
            resource_type="user",
            resource_id=str(uuid4()),
            details={"test": "data"},
            ip_address="127.0.0.1",
            user_agent="test-agent",
            success=True
        )
        
        assert log_id is not None
        assert isinstance(log_id, UUID)
    
    @pytest.mark.asyncio
    async def test_audit_log_retrieval(self, db_session: Database, super_admin_user: dict):
        """Test audit log retrieval with pagination"""
        
        from app.admin.schemas import AdminActionType, AdminActivityFilters
        
        # Create some audit logs
        for i in range(5):
            await AdminAuditCRUD.create_audit_log(
                db=db_session,
                admin_id=super_admin_user["id"],
                action=AdminActionType.UPDATE,
                resource_type="test_resource",
                resource_id=f"test_{i}",
                details={"iteration": i}
            )
        
        # Retrieve logs
        pagination = PaginationParams(page=1, size=3)
        filters = AdminActivityFilters(admin_id=super_admin_user["id"])
        
        logs, total = await AdminAuditCRUD.get_audit_logs_paginated(
            db_session, pagination, filters
        )
        
        assert len(logs) <= 3
        assert total >= 5
        assert all(log["admin_id"] == super_admin_user["id"] for log in logs)


class TestAdminAPIEndpoints:
    """Test admin API endpoints"""
    
    @pytest.mark.asyncio
    async def test_admin_dashboard_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test admin dashboard endpoint"""
        
        response = await client.get(
            "/api/v1/admin/dashboard",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "system_stats" in data
        assert "user_analytics" in data
        assert "recent_activities" in data
    
    @pytest.mark.asyncio
    async def test_admin_users_list_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test admin users list endpoint"""
        
        response = await client.get(
            "/api/v1/admin/users?page=1&size=10",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_admin_create_user_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test admin user creation endpoint"""
        
        user_data = {
            "first_name": "API",
            "last_name": "Test User",
            "email": "api.test@gmail.com",
            "password": "APITest123!",
            "is_active": True,
            "is_verified": True,
            "send_welcome_email": False
        }
        
        response = await client.post(
            "/api/v1/admin/users",
            json=user_data,
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == "api.test@gmail.com"
        assert data["first_name"] == "API"
        assert data["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_admin_bulk_operations_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict, db_session: Database):
        """Test admin bulk operations endpoint"""
        
        # Create test users
        user_ids = []
        for i in range(2):
            user_data = {
                "first_name": f"Bulk{i}",
                "last_name": "API Test",
                "email": f"bulk.api{i}@gmail.com",
                "password": await hash_password("BulkAPI123!"),
                "is_active": False,
                "is_verified": False,
                "is_system_user": False
            }
            user = await UserCRUD.create(db_session, user_data)
            user_ids.append(str(user["id"]))
        
        # Perform bulk operation
        bulk_data = {
            "user_ids": user_ids,
            "operation": "activate"
        }
        
        response = await client.post(
            "/api/v1/admin/users/bulk",
            json=bulk_data,
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_items"] == 2
        assert data["successful_items"] == 2
        assert data["failed_items"] == 0
    
    @pytest.mark.asyncio
    async def test_admin_system_info_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test admin system info endpoint"""
        
        response = await client.get(
            "/api/v1/admin/system/info",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_users" in data
        assert "active_users" in data
        assert "system_users" in data
        assert isinstance(data["system_users"], list)
    
    @pytest.mark.asyncio
    async def test_admin_audit_logs_endpoint(self, client: AsyncClient, super_admin_auth_headers: dict):
        """Test admin audit logs endpoint"""
        
        response = await client.get(
            "/api/v1/admin/audit/logs?page=1&size=10",
            headers=super_admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_admin_unauthorized_access(self, client: AsyncClient, user_auth_headers: dict):
        """Test that regular users cannot access admin endpoints"""
        
        response = await client.get(
            "/api/v1/admin/dashboard",
            headers=user_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Admin access required" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_admin_permission_levels(self, client: AsyncClient, admin_auth_headers: dict):
        """Test that regular admins have limited access"""
        
        # Regular admin should not be able to create users (super admin only)
        user_data = {
            "first_name": "Should",
            "last_name": "Fail",
            "email": "should.fail@gmail.com",
            "password": "ShouldFail123!"
        }
        
        response = await client.post(
            "/api/v1/admin/users",
            json=user_data,
            headers=admin_auth_headers
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Super admin" in data["detail"] or "Insufficient permissions" in data["detail"]
