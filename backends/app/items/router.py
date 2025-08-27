"""
Item API endpoints demonstrating authentication and authorization
"""
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from databases import Database

from app.database import get_db
from app.dependencies import (
    get_current_user_global, get_optional_user_global, get_verified_user, get_admin_user
)
from app.auth.dependencies import require_authentication, require_permissions
from app.items.dependencies import (
    get_valid_item, get_item_filters, get_item_pagination, track_item_view
)
from app.items.service import ItemService, ItemCommentService
from app.items.schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    CommentCreate, CommentResponse, BulkItemOperation, BulkOperationResult,
    ItemStatusUpdate, ItemAnalytics
)
from app.auth.dependencies import CurrentUser

router = APIRouter(prefix="/items", tags=["Items"])


# ================================
# Item CRUD Operations
# ================================

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,
    current_user: CurrentUser = Depends(require_permissions("items:create")),
    db: Database = Depends(get_db)
):
    """
    Create a new item.
    
    **Authentication Required**: Yes
    **Permissions**: Verified users only
    
    **Business Rules**:
    - Only verified users can create items
    - New users cannot directly publish items (auto-changed to draft)
    - Items are private by default
    """
    
    item = await ItemService.create_item(db, item_data, current_user)
    return ItemResponse(**item)


@router.get("/", response_model=ItemListResponse)
async def list_items(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global),
    db: Database = Depends(get_db)
):
    """
    Get paginated list of items with filtering.
    
    **Authentication Required**: No (but affects visibility)
    **Permissions**: 
    - Anonymous users: Only public items
    - Authenticated users: Public items + their own items
    
    **Filtering Options**:
    - category, status, owner_id, is_public
    - price range (min_price, max_price)
    - tags (comma-separated)
    - search (title and description)
    - date range (created_after, created_before)
    
    **Sorting Options**:
    - created_asc/desc, updated_asc/desc
    - title_asc/desc, price_asc/desc
    - views_asc/desc
    """
    
    items_list, metadata = await ItemService.get_item_list(
        db, filters, pagination, current_user
    )
    
    return ItemListResponse(
        items=[ItemResponse(**item) for item in items_list],
        **metadata
    )


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item: dict = Depends(track_item_view),  # This also validates access
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global)
):
    """
    Get a specific item by ID.
    
    **Authentication Required**: No (but affects visibility)
    **Permissions**: 
    - Public items: Anyone can view
    - Private items: Owner only (or users with explicit read permission)
    
    **Features**:
    - Automatically tracks view for analytics
    - Returns permission flags for current user
    - Includes owner information and statistics
    """
    
    return ItemResponse(**item)


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_data: ItemUpdate,
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Update an existing item.
    
    **Authentication Required**: Yes
    **Permissions**: Item owner or users with update permission
    
    **Business Rules**:
    - Status transitions are validated
    - Only verified users can publish items
    - Some fields may require admin approval
    """
    
    updated_item = await ItemService.update_item(
        db, item["id"], item_data, current_user
    )
    
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return ItemResponse(**updated_item)


@router.patch("/{item_id}/status", response_model=ItemResponse)
async def update_item_status(
    status_data: ItemStatusUpdate,
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Update item status with validation.
    
    **Authentication Required**: Yes
    **Permissions**: Item owner or users with update permission
    
    **Status Transitions**:
    - draft → published, archived, deleted
    - published → draft, archived, deleted
    - archived → draft, published, deleted
    - deleted → (no transitions allowed)
    """
    
    from app.items.schemas import ItemUpdate
    
    item_update = ItemUpdate(status=status_data.status)
    updated_item = await ItemService.update_item(
        db, item["id"], item_update, current_user
    )
    
    return ItemResponse(**updated_item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db),
    hard_delete: bool = Query(False, description="Perform hard delete (admin only)")
):
    """
    Delete an item.
    
    **Authentication Required**: Yes
    **Permissions**: Item owner or users with delete permission
    
    **Business Rules**:
    - Published items with comments require admin approval
    - Soft delete by default (hard delete for admins only)
    - Deleted items are hidden from normal queries
    """
    
    # Check hard delete permission
    # TODO: Implement proper admin check
    if hard_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hard delete requires admin privileges"
        )
    
    success = await ItemService.delete_item(
        db, item["id"], current_user, soft_delete=not hard_delete
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )


# ================================
# Item Interactions
# ================================

@router.post("/{item_id}/favorite")
async def toggle_item_favorite(
    item_id: UUID,
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Toggle favorite status for an item.
    
    **Authentication Required**: Yes
    **Permissions**: Any authenticated user (for accessible items)
    
    **Returns**: Updated favorite status and count
    """
    
    result = await ItemService.toggle_favorite(db, item_id, current_user)
    return result


@router.get("/{item_id}/comments", response_model=List[CommentResponse])
async def get_item_comments(
    item: dict = Depends(get_valid_item),
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global),
    db: Database = Depends(get_db)
):
    """
    Get all comments for an item.
    
    **Authentication Required**: No (but affects visibility)
    **Permissions**: Same as item access permissions
    
    **Features**:
    - Threaded comments support
    - Permission flags for each comment
    - Author information included
    """
    
    current_user_id = current_user.id if current_user else None
    comments = await ItemCommentService.get_item_comments(
        db, item["id"], current_user_id
    )
    
    return [CommentResponse(**comment) for comment in comments]


@router.post("/{item_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_item_comment(
    comment_data: CommentCreate,
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Create a comment on an item.
    
    **Authentication Required**: Yes
    **Permissions**: Users who can access the item and commenting is enabled
    
    **Features**:
    - Threaded comments (reply to other comments)
    - Auto-approval for verified users
    - Moderation queue for new users
    """
    
    comment = await ItemCommentService.create_comment(
        db, item["id"], comment_data, current_user
    )
    
    return CommentResponse(**comment)


# ================================
# Bulk Operations
# ================================

@router.post("/bulk", response_model=BulkOperationResult)
async def bulk_item_operation(
    operation_data: BulkItemOperation,
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Perform bulk operations on multiple items.
    
    **Authentication Required**: Yes
    **Permissions**: User must have appropriate permission for each item
    
    **Supported Operations**:
    - delete: Soft delete items
    - archive: Archive items
    - publish: Publish items
    - draft: Change items to draft status
    
    **Returns**: Summary of successful and failed operations
    """
    
    result = await ItemService.bulk_operation(db, operation_data, current_user)
    return result


# ================================
# User's Items
# ================================

@router.get("/my/items", response_model=ItemListResponse)
async def get_my_items(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Get current user's items.
    
    **Authentication Required**: Yes
    **Permissions**: User's own items only
    
    **Features**:
    - Includes all items (public and private)
    - Same filtering and sorting options as main list
    - Shows items in all statuses (including deleted)
    """
    
    # Override filters to show only user's items
    filters.owner_id = current_user.id
    
    items_list, metadata = await ItemService.get_item_list(
        db, filters, pagination, current_user
    )
    
    return ItemListResponse(
        items=[ItemResponse(**item) for item in items_list],
        **metadata
    )


@router.get("/my/favorites", response_model=ItemListResponse)
async def get_my_favorites(
    pagination: dict = Depends(get_item_pagination),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Get current user's favorite items.
    
    **Authentication Required**: Yes
    **Permissions**: User's own favorites only
    """
    
    from app.items.models import item_favorites
    from sqlalchemy import select, join
    
    # Get user's favorite item IDs
    favorites_query = select(item_favorites.c.item_id).where(
        item_favorites.c.user_id == current_user.id
    )
    favorite_item_ids = await db.fetch_all(favorites_query)
    
    if not favorite_item_ids:
        return ItemListResponse(
            items=[],
            total=0,
            page=pagination.page,
            size=pagination.size,
            pages=0,
            has_next=False,
            has_prev=False
        )
    
    # Create filters for favorite items
    from app.items.schemas import ItemFilters
    filters = ItemFilters()
    
    # Get favorite items (this is a simplified approach)
    # In a real implementation, you'd want to optimize this query
    favorite_items = []
    for fav in favorite_item_ids:
        item = await ItemService.get_item_list(db, filters, pagination, current_user)
        # Filter logic would be more complex here
    
    # For now, return empty result - this would need proper implementation
    return ItemListResponse(
        items=[],
        total=len(favorite_item_ids),
        page=pagination.page,
        size=pagination.size,
        pages=1,
        has_next=False,
        has_prev=False
    )


# ================================
# Admin Operations
# ================================

@router.get("/admin/all", response_model=ItemListResponse)
async def admin_get_all_items(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: CurrentUser = Depends(require_permissions("items:list_all")),
    db: Database = Depends(get_db),
    include_deleted: bool = Query(False, description="Include deleted items")
):
    """
    Admin endpoint to get all items including private and deleted ones.
    
    **Authentication Required**: Yes
    **Permissions**: Admin only
    
    **Features**:
    - Access to all items regardless of visibility
    - Option to include deleted items
    - Full filtering and sorting capabilities
    """
    
    # Admin can see all items
    items_list, metadata = await ItemService.get_item_list(
        db, filters, pagination, current_user
    )
    
    return ItemListResponse(
        items=[ItemResponse(**item) for item in items_list],
        **metadata
    )


@router.post("/{item_id}/admin/restore", response_model=ItemResponse)
async def admin_restore_item(
    item_id: UUID,
    admin_user: CurrentUser = Depends(get_admin_user),
    db: Database = Depends(get_db)
):
    """
    Admin endpoint to restore a deleted item.
    
    **Authentication Required**: Yes
    **Permissions**: Admin only
    """
    
    from app.items.models import items, ItemStatus
    from sqlalchemy import update
    
    # Restore the item
    query = update(items).where(items.c.id == item_id).values(
        deleted_at=None,
        deleted_by=None,
        status=ItemStatus.DRAFT,
        updated_at=datetime.now(timezone.utc)
    )
    
    result = await db.execute(query)
    
    if result == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Get the restored item
    restored_item = await ItemService.get_item_list(db, {}, {}, admin_user)
    # This is simplified - you'd want to get the specific item
    
    return {"message": "Item restored successfully"}


# ================================
# Analytics (Admin/Owner only)
# ================================

@router.get("/{item_id}/analytics", response_model=ItemAnalytics)
async def get_item_analytics(
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Get analytics for an item.
    
    **Authentication Required**: Yes
    **Permissions**: Item owner or admin
    
    **Analytics Include**:
    - View statistics
    - Comment statistics
    - Favorite statistics
    - View trends over time
    """
    
    # Check if user can view analytics (owner only for now)
    # TODO: Implement proper admin check
    if item["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view analytics for your own items"
        )
    
    # Get analytics data
    from app.items.models import item_views
    from sqlalchemy import select, func, distinct
    
    # Basic stats
    total_views_query = select(func.count()).select_from(item_views).where(
        item_views.c.item_id == item["id"]
    )
    total_views = await db.fetch_val(total_views_query) or 0
    
    unique_viewers_query = select(func.count(distinct(item_views.c.viewer_id))).select_from(
        item_views
    ).where(
        and_(
            item_views.c.item_id == item["id"],
            item_views.c.viewer_id.is_not(None)
        )
    )
    unique_viewers = await db.fetch_val(unique_viewers_query) or 0
    
    analytics = ItemAnalytics(
        item_id=item["id"],
        total_views=total_views,
        unique_viewers=unique_viewers,
        total_comments=item["comment_count"],
        total_favorites=item["favorite_count"],
        views_by_day=[],  # Would implement proper time-series data
        top_referrers=[]   # Would implement referrer tracking
    )
    
    return analytics
