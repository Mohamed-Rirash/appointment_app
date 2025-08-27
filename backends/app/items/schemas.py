"""
Item Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.items.models import ItemStatus, ItemCategory


# Base schemas
class ItemBase(BaseModel):
    """Base item schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255, description="Item title")
    description: Optional[str] = Field(None, max_length=5000, description="Item description")
    category: ItemCategory = Field(ItemCategory.OTHER, description="Item category")
    price: Optional[float] = Field(None, ge=0, description="Item price")
    quantity: int = Field(0, ge=0, description="Available quantity")
    sku: Optional[str] = Field(None, max_length=100, description="Stock keeping unit")
    tags: List[str] = Field(default_factory=list, description="Item tags")
    is_public: bool = Field(False, description="Whether item is publicly visible")
    allow_comments: bool = Field(True, description="Whether comments are allowed")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return [tag.strip().lower() for tag in v if tag.strip()]

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        return v.strip()


class ItemCreate(ItemBase):
    """Schema for creating new items"""
    status: ItemStatus = Field(ItemStatus.DRAFT, description="Initial item status")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ItemUpdate(BaseModel):
    """Schema for updating existing items"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    category: Optional[ItemCategory] = None
    status: Optional[ItemStatus] = None
    price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    sku: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    allow_comments: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            return [tag.strip().lower() for tag in v if tag.strip()]
        return v

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        return v.strip() if v else v


class ItemStatusUpdate(BaseModel):
    """Schema for updating item status"""
    status: ItemStatus = Field(..., description="New item status")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for status change")


# Response schemas
class ItemOwner(BaseModel):
    """Item owner information"""
    id: UUID
    first_name: str
    last_name: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)


class ItemResponse(ItemBase):
    """Schema for item responses"""
    id: UUID
    status: ItemStatus
    owner_id: UUID
    owner: Optional[ItemOwner] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Permission flags (computed based on current user)
    can_update: bool = Field(False, description="Current user can update this item")
    can_delete: bool = Field(False, description="Current user can delete this item")
    can_comment: bool = Field(False, description="Current user can comment on this item")
    
    # Statistics
    view_count: int = Field(0, description="Number of views")
    comment_count: int = Field(0, description="Number of comments")
    favorite_count: int = Field(0, description="Number of users who favorited this item")
    is_favorited: bool = Field(False, description="Current user has favorited this item")
    
    model_config = ConfigDict(from_attributes=True)


class ItemListResponse(BaseModel):
    """Schema for paginated item list responses"""
    items: List[ItemResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# Comment schemas
class CommentBase(BaseModel):
    """Base comment schema"""
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")
    parent_comment_id: Optional[UUID] = Field(None, description="Parent comment ID for replies")


class CommentCreate(CommentBase):
    """Schema for creating comments"""
    pass


class CommentUpdate(BaseModel):
    """Schema for updating comments"""
    content: str = Field(..., min_length=1, max_length=2000)


class CommentAuthor(BaseModel):
    """Comment author information"""
    id: UUID
    first_name: str
    last_name: str
    
    model_config = ConfigDict(from_attributes=True)


class CommentResponse(CommentBase):
    """Schema for comment responses"""
    id: UUID
    item_id: UUID
    author_id: UUID
    author: Optional[CommentAuthor] = None
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Permission flags
    can_update: bool = Field(False, description="Current user can update this comment")
    can_delete: bool = Field(False, description="Current user can delete this comment")
    
    # Nested replies (for threaded comments)
    replies: List["CommentResponse"] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


# Update forward reference for nested comments
CommentResponse.model_rebuild()


# Permission schemas
class ItemPermissionBase(BaseModel):
    """Base item permission schema"""
    can_read: bool = Field(True, description="Can read the item")
    can_update: bool = Field(False, description="Can update the item")
    can_delete: bool = Field(False, description="Can delete the item")
    can_comment: bool = Field(True, description="Can comment on the item")
    can_share: bool = Field(True, description="Can share the item")


class ItemPermissionCreate(ItemPermissionBase):
    """Schema for creating item permissions"""
    user_id: Optional[UUID] = Field(None, description="User ID (for user-specific permissions)")
    role_id: Optional[UUID] = Field(None, description="Role ID (for role-based permissions)")
    expires_at: Optional[datetime] = Field(None, description="Permission expiration time")
    
    @field_validator('user_id', 'role_id')
    @classmethod
    def validate_user_or_role(cls, v, info):
        if hasattr(info, 'data') and info.data:
            user_id = info.data.get('user_id')
            role_id = info.data.get('role_id')

            if not user_id and not role_id:
                raise ValueError('Either user_id or role_id must be provided')
            if user_id and role_id:
                raise ValueError('Cannot specify both user_id and role_id')

        return v


class ItemPermissionResponse(ItemPermissionBase):
    """Schema for item permission responses"""
    id: UUID
    item_id: UUID
    user_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    granted_by: UUID
    granted_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Filter and query schemas
class ItemFilters(BaseModel):
    """Schema for item filtering"""
    category: Optional[ItemCategory] = Field(None, description="Filter by category")
    status: Optional[ItemStatus] = Field(None, description="Filter by status")
    owner_id: Optional[UUID] = Field(None, description="Filter by owner")
    is_public: Optional[bool] = Field(None, description="Filter by public visibility")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    tags: Optional[List[str]] = Field(None, description="Filter by tags (OR operation)")
    search: Optional[str] = Field(None, min_length=1, max_length=100, description="Search in title and description")
    created_after: Optional[datetime] = Field(None, description="Filter items created after this date")
    created_before: Optional[datetime] = Field(None, description="Filter items created before this date")
    
    @field_validator('max_price')
    @classmethod
    def validate_price_range(cls, v, info):
        if hasattr(info, 'data') and info.data:
            min_price = info.data.get('min_price')
            if min_price is not None and v is not None and v < min_price:
                raise ValueError('max_price must be greater than or equal to min_price')
        return v


class ItemSortOptions(str, Enum):
    """Item sorting options"""
    CREATED_ASC = "created_asc"
    CREATED_DESC = "created_desc"
    UPDATED_ASC = "updated_asc"
    UPDATED_DESC = "updated_desc"
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    VIEWS_ASC = "views_asc"
    VIEWS_DESC = "views_desc"


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Items per page")
    sort: ItemSortOptions = Field(ItemSortOptions.CREATED_DESC, description="Sort order")


# Analytics schemas
class ItemViewCreate(BaseModel):
    """Schema for recording item views"""
    view_duration: Optional[int] = Field(None, ge=0, description="View duration in seconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional view metadata")


class ItemAnalytics(BaseModel):
    """Schema for item analytics"""
    item_id: UUID
    total_views: int
    unique_viewers: int
    total_comments: int
    total_favorites: int
    average_view_duration: Optional[float] = None
    views_by_day: List[Dict[str, Any]] = Field(default_factory=list)
    top_referrers: List[Dict[str, Any]] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


# Bulk operation schemas
class BulkItemOperation(BaseModel):
    """Schema for bulk item operations"""
    item_ids: List[UUID] = Field(..., min_length=1, max_length=100, description="List of item IDs")
    operation: str = Field(..., pattern="^(delete|archive|publish|draft)$", description="Operation to perform")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for bulk operation")


class BulkOperationResult(BaseModel):
    """Schema for bulk operation results"""
    total_items: int
    successful_items: int
    failed_items: int
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    operation: str
    processed_at: datetime = Field(default_factory=lambda: datetime.now(datetime.timezone.utc))
