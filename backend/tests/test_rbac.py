"""
RBAC (Role-Based Access Control) tests
"""
import pytest
from httpx import AsyncClient
from databases import Database
from uuid import uuid4

from app.auth.rbac import RoleCRUD, PermissionCRUD, RBACCRUD
from app.auth.crud import UserCRUD
from app.core.security import hash_password
from tests.conftest import TestUtils


class TestRoleManagement:
    """Test role management"""
    
    @pytest.mark.asyncio
    async def test_create_role(self, db_session: Database):
        """Test role creation"""
        role_data = {
            "name": "test_role",
            "display_name": "Test Role",
            "description": "A test role",
            "is_system": False
        }
        
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        assert role is not None
        assert role["name"] == "test_role"
        assert role["display_name"] == "Test Role"
        assert role["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_role_by_name(self, db_session: Database):
        """Test getting role by name"""
        # Create role first
        role_data = {
            "name": "findable_role",
            "display_name": "Findable Role",
            "description": "A role to find"
        }
        
        created_role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # Find role
        found_role = await RoleCRUD.get_by_name(db_session, "findable_role")
        
        assert found_role is not None
        assert found_role["id"] == created_role["id"]
        assert found_role["name"] == "findable_role"
    
    @pytest.mark.asyncio
    async def test_list_roles(self, db_session: Database):
        """Test listing all roles"""
        # Create multiple roles
        for i in range(3):
            role_data = {
                "name": f"list_role_{i}",
                "display_name": f"List Role {i}",
                "description": f"Role {i} for listing test"
            }
            await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # List roles
        roles = await RoleCRUD.list_all(db_session)
        
        assert len(roles) >= 3
        role_names = [role["name"] for role in roles]
        assert "list_role_0" in role_names
        assert "list_role_1" in role_names
        assert "list_role_2" in role_names
    
    @pytest.mark.asyncio
    async def test_update_role(self, db_session: Database):
        """Test role update"""
        # Create role
        role_data = {
            "name": "updatable_role",
            "display_name": "Original Name",
            "description": "Original description"
        }
        
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # Update role
        updates = {
            "display_name": "Updated Name",
            "description": "Updated description"
        }
        
        updated_role = await RoleCRUD.update(db_session, role["id"], updates, updated_by=uuid4())
        
        assert updated_role is not None
        assert updated_role["display_name"] == "Updated Name"
        assert updated_role["description"] == "Updated description"
        assert updated_role["name"] == "updatable_role"  # Name shouldn't change


class TestPermissionManagement:
    """Test permission management"""
    
    @pytest.mark.asyncio
    async def test_create_permission(self, db_session: Database):
        """Test permission creation"""
        perm_data = {
            "resource": "test_resource",
            "action": "test_action",
            "description": "A test permission"
        }
        
        permission = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        assert permission is not None
        assert permission["resource"] == "test_resource"
        assert permission["action"] == "test_action"
        assert permission["name"] == "test_resource:test_action"
        assert permission["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_permission_by_name(self, db_session: Database):
        """Test getting permission by name"""
        # Create permission
        perm_data = {
            "resource": "findable",
            "action": "read",
            "description": "Findable permission"
        }
        
        created_perm = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        # Find permission
        found_perm = await PermissionCRUD.get_by_name(db_session, "findable:read")
        
        assert found_perm is not None
        assert found_perm["id"] == created_perm["id"]
        assert found_perm["name"] == "findable:read"
    
    @pytest.mark.asyncio
    async def test_list_permissions_by_resource(self, db_session: Database):
        """Test listing permissions by resource"""
        # Create permissions for same resource
        resource = "test_resource"
        actions = ["create", "read", "update", "delete"]
        
        for action in actions:
            perm_data = {
                "resource": resource,
                "action": action,
                "description": f"Test {action} permission"
            }
            await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        # List permissions for resource
        permissions = await PermissionCRUD.list_by_resource(db_session, resource)
        
        assert len(permissions) == 4
        perm_actions = [perm["action"] for perm in permissions]
        for action in actions:
            assert action in perm_actions


class TestRolePermissionAssignment:
    """Test role-permission assignments"""
    
    @pytest.mark.asyncio
    async def test_grant_permission_to_role(self, db_session: Database):
        """Test granting permission to role"""
        # Create role and permission
        role_data = {
            "name": "test_role",
            "display_name": "Test Role",
            "description": "Test role"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        perm_data = {
            "resource": "test",
            "action": "read",
            "description": "Test permission"
        }
        permission = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        # Grant permission to role
        result = await RBACCRUD.grant_permission_to_role(
            db_session, role["id"], permission["id"], granted_by=uuid4()
        )
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_revoke_permission_from_role(self, db_session: Database):
        """Test revoking permission from role"""
        # Create role and permission
        role_data = {
            "name": "revoke_test_role",
            "display_name": "Revoke Test Role",
            "description": "Test role for revocation"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        perm_data = {
            "resource": "revoke_test",
            "action": "write",
            "description": "Test permission for revocation"
        }
        permission = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        # Grant permission first
        await RBACCRUD.grant_permission_to_role(
            db_session, role["id"], permission["id"], granted_by=uuid4()
        )
        
        # Revoke permission
        result = await RBACCRUD.revoke_permission_from_role(
            db_session, role["id"], permission["id"], revoked_by=uuid4()
        )
        
        assert result is True


class TestUserRoleAssignment:
    """Test user-role assignments"""
    
    @pytest.mark.asyncio
    async def test_assign_role_to_user(self, db_session: Database):
        """Test assigning role to user"""
        # Create user and role
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "roletest@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True
        }
        user = await UserCRUD.create(db_session, user_data)
        
        role_data = {
            "name": "assignable_role",
            "display_name": "Assignable Role",
            "description": "Role for assignment test"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # Assign role to user
        result = await RBACCRUD.assign_role_to_user(
            db_session, user["id"], role["id"], assigned_by=uuid4()
        )
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_get_user_roles(self, db_session: Database):
        """Test getting user roles"""
        # Create user
        user_data = {
            "first_name": "Multi",
            "last_name": "Role",
            "email": "multirole@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True
        }
        user = await UserCRUD.create(db_session, user_data)
        
        # Create multiple roles
        roles = []
        for i in range(3):
            role_data = {
                "name": f"user_role_{i}",
                "display_name": f"User Role {i}",
                "description": f"Role {i} for user"
            }
            role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
            roles.append(role)
            
            # Assign role to user
            await RBACCRUD.assign_role_to_user(
                db_session, user["id"], role["id"], assigned_by=uuid4()
            )
        
        # Get user roles
        user_roles = await RBACCRUD.get_user_roles(db_session, user["id"])
        
        assert len(user_roles) == 3
        role_names = [role["name"] for role in user_roles]
        assert "user_role_0" in role_names
        assert "user_role_1" in role_names
        assert "user_role_2" in role_names
    
    @pytest.mark.asyncio
    async def test_remove_role_from_user(self, db_session: Database):
        """Test removing role from user"""
        # Create user and role
        user_data = {
            "first_name": "Remove",
            "last_name": "Role",
            "email": "removerole@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True
        }
        user = await UserCRUD.create(db_session, user_data)
        
        role_data = {
            "name": "removable_role",
            "display_name": "Removable Role",
            "description": "Role for removal test"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # Assign role first
        await RBACCRUD.assign_role_to_user(
            db_session, user["id"], role["id"], assigned_by=uuid4()
        )
        
        # Remove role
        result = await RBACCRUD.remove_role_from_user(
            db_session, user["id"], role["id"], removed_by=uuid4()
        )
        
        assert result is True


class TestPermissionChecking:
    """Test permission checking"""
    
    @pytest.mark.asyncio
    async def test_user_has_permission(self, db_session: Database):
        """Test checking if user has permission"""
        # Create user
        user_data = {
            "first_name": "Permission",
            "last_name": "Test",
            "email": "permtest@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True
        }
        user = await UserCRUD.create(db_session, user_data)
        
        # Create role and permission
        role_data = {
            "name": "perm_test_role",
            "display_name": "Permission Test Role",
            "description": "Role for permission testing"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        perm_data = {
            "resource": "test_resource",
            "action": "test_action",
            "description": "Test permission"
        }
        permission = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
        
        # Grant permission to role
        await RBACCRUD.grant_permission_to_role(
            db_session, role["id"], permission["id"], granted_by=uuid4()
        )
        
        # Assign role to user
        await RBACCRUD.assign_role_to_user(
            db_session, user["id"], role["id"], assigned_by=uuid4()
        )
        
        # Check if user has permission
        has_permission = await RBACCRUD.user_has_permission(
            db_session, user["id"], "test_resource", "test_action"
        )
        
        assert has_permission is True
        
        # Check for permission user doesn't have
        no_permission = await RBACCRUD.user_has_permission(
            db_session, user["id"], "other_resource", "other_action"
        )
        
        assert no_permission is False
    
    @pytest.mark.asyncio
    async def test_get_user_permissions(self, db_session: Database):
        """Test getting all user permissions"""
        # Create user
        user_data = {
            "first_name": "All",
            "last_name": "Permissions",
            "email": "allperms@example.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": True
        }
        user = await UserCRUD.create(db_session, user_data)
        
        # Create role
        role_data = {
            "name": "multi_perm_role",
            "display_name": "Multi Permission Role",
            "description": "Role with multiple permissions"
        }
        role = await RoleCRUD.create(db_session, role_data, created_by=uuid4())
        
        # Create multiple permissions
        permissions = []
        for action in ["create", "read", "update", "delete"]:
            perm_data = {
                "resource": "multi_test",
                "action": action,
                "description": f"Multi test {action} permission"
            }
            permission = await PermissionCRUD.create(db_session, perm_data, created_by=uuid4())
            permissions.append(permission)
            
            # Grant permission to role
            await RBACCRUD.grant_permission_to_role(
                db_session, role["id"], permission["id"], granted_by=uuid4()
            )
        
        # Assign role to user
        await RBACCRUD.assign_role_to_user(
            db_session, user["id"], role["id"], assigned_by=uuid4()
        )
        
        # Get user permissions
        user_permissions = await RBACCRUD.get_user_permissions(db_session, user["id"])
        
        assert len(user_permissions) == 4
        perm_names = [perm["name"] for perm in user_permissions]
        assert "multi_test:create" in perm_names
        assert "multi_test:read" in perm_names
        assert "multi_test:update" in perm_names
        assert "multi_test:delete" in perm_names
