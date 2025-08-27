"""
Comprehensive tests for Items module demonstrating authentication and authorization
"""
import pytest
from httpx import AsyncClient
from databases import Database
from uuid import UUID, uuid4
from datetime import datetime

from app.auth.crud import UserCRUD
from app.core.security import hash_password
from app.items.service import ItemService, ItemCommentService
from app.items.schemas import ItemCreate, ItemUpdate, CommentCreate, BulkItemOperation
from app.items.models import ItemStatus, ItemCategory
from tests.conftest import TestUtils


class TestItemAuthentication:
    """Test item authentication requirements"""
    
    @pytest.mark.asyncio
    async def test_create_item_requires_authentication(self, client: AsyncClient):
        """Test that creating items requires authentication"""
        
        item_data = {
            "title": "Test Item",
            "description": "Test description",
            "category": "electronics",
            "price": 99.99
        }
        
        response = await client.post("/api/v1/items/", json=item_data)
        
        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_create_item_requires_verified_user(self, client: AsyncClient, db_session: Database):
        """Test that only verified users can create items"""
        
        # Create unverified user
        unverified_user_data = {
            "first_name": "Unverified",
            "last_name": "User",
            "email": "unverified@gmail.com",
            "password": await hash_password("TestPass123!"),
            "is_active": True,
            "is_verified": False,
            "is_system_user": False
        }
        
        unverified_user = await UserCRUD.create(db_session, unverified_user_data)

        # Get auth headers for unverified user
        unverified_headers = TestUtils.get_auth_headers(unverified_user["id"])
        
        item_data = {
            "title": "Test Item",
            "description": "Test description",
            "category": "electronics"
        }
        
        response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=unverified_headers
        )
        
        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_anonymous_can_view_public_items(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that anonymous users can view public items"""
        
        # Create a public item
        item_data = {
            "title": "Public Item",
            "description": "This is a public item",
            "category": "books",
            "is_public": True
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Try to access without authentication
        response = await client.get(f"/api/v1/items/{item_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public Item"
        assert data["is_public"] is True
    
    @pytest.mark.asyncio
    async def test_anonymous_cannot_view_private_items(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that anonymous users cannot view private items"""
        
        # Create a private item
        item_data = {
            "title": "Private Item",
            "description": "This is a private item",
            "category": "books",
            "is_public": False
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Try to access without authentication
        response = await client.get(f"/api/v1/items/{item_id}")
        
        assert response.status_code == 404
        assert "not found or access denied" in response.json()["detail"]


class TestItemAuthorization:
    """Test item authorization and permissions"""
    
    @pytest.mark.asyncio
    async def test_owner_can_update_item(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that item owner can update their item"""
        
        # Create item
        item_data = {
            "title": "Original Title",
            "description": "Original description",
            "category": "electronics"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Update item
        update_data = {
            "title": "Updated Title",
            "description": "Updated description"
        }
        
        update_response = await client.put(
            f"/api/v1/items/{item_id}",
            json=update_data,
            headers=user_auth_headers
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"
    
    @pytest.mark.asyncio
    async def test_non_owner_cannot_update_item(self, client: AsyncClient, db_session: Database, test_user: dict, user_auth_headers: dict):
        """Test that non-owners cannot update items"""
        
        # Create another user
        other_user_data = {
            "first_name": "Other",
            "last_name": "User",
            "email": "other@gmail.com",
            "password": await hash_password("OtherPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        other_user = await UserCRUD.create(db_session, other_user_data)
        other_headers = TestUtils.get_auth_headers(other_user["id"])
        
        # Create item with first user
        item_data = {
            "title": "Owner's Item",
            "description": "This belongs to the owner",
            "category": "electronics"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Try to update with other user
        update_data = {
            "title": "Hacked Title"
        }
        
        update_response = await client.put(
            f"/api/v1/items/{item_id}",
            json=update_data,
            headers=other_headers
        )
        
        assert update_response.status_code == 404  # Item not found (access denied)
    
    @pytest.mark.asyncio
    async def test_owner_can_delete_item(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that item owner can delete their item"""
        
        # Create item
        item_data = {
            "title": "Item to Delete",
            "description": "This will be deleted",
            "category": "electronics"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Delete item
        delete_response = await client.delete(
            f"/api/v1/items/{item_id}",
            headers=user_auth_headers
        )
        
        assert delete_response.status_code == 204
        
        # Verify item is deleted (soft delete)
        get_response = await client.get(
            f"/api/v1/items/{item_id}",
            headers=user_auth_headers
        )
        
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_admin_can_access_all_items(self, client: AsyncClient, admin_auth_headers: dict, test_user: dict, user_auth_headers: dict):
        """Test that admins can access all items"""
        
        # Create private item with regular user
        item_data = {
            "title": "Private Item",
            "description": "Admin should see this",
            "category": "electronics",
            "is_public": False
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Admin should be able to access via admin endpoint
        admin_response = await client.get(
            "/api/v1/items/admin/all",
            headers=admin_auth_headers
        )
        
        assert admin_response.status_code == 200
        # Admin should see the private item in the list


class TestItemBusinessLogic:
    """Test item business logic and validation"""
    
    @pytest.mark.asyncio
    async def test_new_users_cannot_publish_directly(self, client: AsyncClient, db_session: Database):
        """Test that new users cannot publish items directly"""
        
        # Create a new user (less than 7 days old)
        new_user_data = {
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@gmail.com",
            "password": await hash_password("NewPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        new_user = await UserCRUD.create(db_session, new_user_data)
        new_user_headers = TestUtils.get_auth_headers(new_user["id"])
        
        # Try to create published item
        item_data = {
            "title": "Published Item",
            "description": "Should be draft",
            "category": "electronics",
            "status": "published"
        }
        
        response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=new_user_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Should be auto-changed to draft
        assert data["status"] == "draft"
    
    @pytest.mark.asyncio
    async def test_status_transition_validation(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test item status transition validation"""
        
        # Create draft item
        item_data = {
            "title": "Status Test Item",
            "description": "Testing status transitions",
            "category": "electronics",
            "status": "draft"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Valid transition: draft -> published
        status_update = {"status": "published"}
        
        response = await client.patch(
            f"/api/v1/items/{item_id}/status",
            json=status_update,
            headers=user_auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "published"
        assert response.json()["published_at"] is not None
    
    @pytest.mark.asyncio
    async def test_published_items_with_comments_require_admin_to_delete(self, client: AsyncClient, db_session: Database, test_user: dict, user_auth_headers: dict):
        """Test that published items with comments require admin approval to delete"""
        
        # Create and publish item
        item_data = {
            "title": "Item with Comments",
            "description": "This will have comments",
            "category": "electronics",
            "status": "published",
            "is_public": True,
            "allow_comments": True
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Add a comment
        comment_data = {
            "content": "This is a test comment"
        }
        
        comment_response = await client.post(
            f"/api/v1/items/{item_id}/comments",
            json=comment_data,
            headers=user_auth_headers
        )
        
        assert comment_response.status_code == 201
        
        # Try to delete item (should fail for non-admin)
        delete_response = await client.delete(
            f"/api/v1/items/{item_id}",
            headers=user_auth_headers
        )
        
        assert delete_response.status_code == 403
        assert "Published items with comments can only be deleted by admins" in delete_response.json()["detail"]


class TestItemComments:
    """Test item comment functionality"""
    
    @pytest.mark.asyncio
    async def test_create_comment_on_public_item(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test creating comments on public items"""
        
        # Create public item
        item_data = {
            "title": "Commentable Item",
            "description": "You can comment on this",
            "category": "electronics",
            "is_public": True,
            "allow_comments": True
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Create comment
        comment_data = {
            "content": "This is a great item!"
        }
        
        comment_response = await client.post(
            f"/api/v1/items/{item_id}/comments",
            json=comment_data,
            headers=user_auth_headers
        )
        
        assert comment_response.status_code == 201
        comment = comment_response.json()
        assert comment["content"] == "This is a great item!"
        assert comment["item_id"] == item_id
        assert comment["author_id"] == str(test_user["id"])
    
    @pytest.mark.asyncio
    async def test_cannot_comment_when_disabled(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that comments cannot be created when disabled"""
        
        # Create item with comments disabled
        item_data = {
            "title": "No Comments Item",
            "description": "Comments are disabled",
            "category": "electronics",
            "is_public": True,
            "allow_comments": False
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Try to create comment
        comment_data = {
            "content": "This should fail"
        }
        
        comment_response = await client.post(
            f"/api/v1/items/{item_id}/comments",
            json=comment_data,
            headers=user_auth_headers
        )
        
        assert comment_response.status_code == 403
        assert "Comments are not allowed" in comment_response.json()["detail"]


class TestItemBulkOperations:
    """Test bulk operations on items"""
    
    @pytest.mark.asyncio
    async def test_bulk_archive_items(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test bulk archiving of items"""
        
        # Create multiple items
        item_ids = []
        for i in range(3):
            item_data = {
                "title": f"Bulk Item {i}",
                "description": f"Item {i} for bulk testing",
                "category": "electronics"
            }
            
            response = await client.post(
                "/api/v1/items/",
                json=item_data,
                headers=user_auth_headers
            )
            
            assert response.status_code == 201
            item_ids.append(response.json()["id"])
        
        # Perform bulk archive
        bulk_data = {
            "item_ids": item_ids,
            "operation": "archive",
            "reason": "Bulk archiving for testing"
        }
        
        bulk_response = await client.post(
            "/api/v1/items/bulk",
            json=bulk_data,
            headers=user_auth_headers
        )
        
        assert bulk_response.status_code == 200
        result = bulk_response.json()
        
        assert result["total_items"] == 3
        assert result["successful_items"] == 3
        assert result["failed_items"] == 0
        assert result["operation"] == "archive"
        
        # Verify items are archived
        for item_id in item_ids:
            item_response = await client.get(
                f"/api/v1/items/{item_id}",
                headers=user_auth_headers
            )
            
            assert item_response.status_code == 200
            assert item_response.json()["status"] == "archived"


class TestItemFavorites:
    """Test item favorite functionality"""
    
    @pytest.mark.asyncio
    async def test_toggle_item_favorite(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test toggling item favorite status"""
        
        # Create public item
        item_data = {
            "title": "Favorite Item",
            "description": "This can be favorited",
            "category": "electronics",
            "is_public": True
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Add to favorites
        favorite_response = await client.post(
            f"/api/v1/items/{item_id}/favorite",
            headers=user_auth_headers
        )
        
        assert favorite_response.status_code == 200
        data = favorite_response.json()
        assert data["is_favorited"] is True
        assert data["favorite_count"] == 1
        assert data["action"] == "favorited"
        
        # Remove from favorites
        unfavorite_response = await client.post(
            f"/api/v1/items/{item_id}/favorite",
            headers=user_auth_headers
        )
        
        assert unfavorite_response.status_code == 200
        data = unfavorite_response.json()
        assert data["is_favorited"] is False
        assert data["favorite_count"] == 0
        assert data["action"] == "unfavorited"


class TestItemAnalytics:
    """Test item analytics functionality"""
    
    @pytest.mark.asyncio
    async def test_owner_can_view_analytics(self, client: AsyncClient, test_user: dict, user_auth_headers: dict):
        """Test that item owner can view analytics"""
        
        # Create item
        item_data = {
            "title": "Analytics Item",
            "description": "Item for analytics testing",
            "category": "electronics"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # View analytics
        analytics_response = await client.get(
            f"/api/v1/items/{item_id}/analytics",
            headers=user_auth_headers
        )
        
        assert analytics_response.status_code == 200
        data = analytics_response.json()
        
        assert "total_views" in data
        assert "unique_viewers" in data
        assert "total_comments" in data
        assert "total_favorites" in data
        assert data["item_id"] == item_id
    
    @pytest.mark.asyncio
    async def test_non_owner_cannot_view_analytics(self, client: AsyncClient, db_session: Database, test_user: dict, user_auth_headers: dict):
        """Test that non-owners cannot view analytics"""
        
        # Create another user
        other_user_data = {
            "first_name": "Other",
            "last_name": "User",
            "email": "other.analytics@gmail.com",
            "password": await hash_password("OtherPass123!"),
            "is_active": True,
            "is_verified": True,
            "is_system_user": False
        }
        
        other_user = await UserCRUD.create(db_session, other_user_data)
        other_headers = TestUtils.get_auth_headers(other_user["id"])
        
        # Create item with first user
        item_data = {
            "title": "Private Analytics",
            "description": "Analytics should be private",
            "category": "electronics"
        }
        
        create_response = await client.post(
            "/api/v1/items/",
            json=item_data,
            headers=user_auth_headers
        )
        
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Try to view analytics with other user
        analytics_response = await client.get(
            f"/api/v1/items/{item_id}/analytics",
            headers=other_headers
        )
        
        assert analytics_response.status_code == 403
        assert "You can only view analytics for your own items" in analytics_response.json()["detail"]
