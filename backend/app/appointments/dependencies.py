"""
Item module specific dependencies
Uses global dependencies from app.dependencies and adds item-specific functionality
"""

from typing import Callable, Optional
from uuid import UUID

from databases import Database
from fastapi import Depends, HTTPException, Path, Query, status

from app.appointments.crud import ItemCRUD
from app.appointments.models import ItemCategory, appointmentstatus
from app.appointments.schemas import ItemFilters, appointmentsortOptions
from app.auth. import CurrentUser
from app.database import get_db
from app.dependencies import (CommonPagination, FilterParams, OptionalAuth,
                              RequireAuth, SearchParams, get_admin_user,
                              get_current_user_global,
                              get_optional_user_global, get_verified_user,
                              require_ownership_or_admin, validate_uuid)
from app.schemas import PaginationParams

# ================================
# Item-Specific Dependencies
# ================================


async def validate_item_id(item_id: UUID = Path(..., description="Item ID")) -> UUID:
    """Validate item ID parameter"""
    return item_id


async def get_valid_item(
    item_id: UUID = Depends(validate_item_id),
    current_user: Optional[CurrentUser] = OptionalAuth,
    db: Database = Depends(get_db),
) -> dict:
    """Get and validate item exists and user can access it"""

    current_user_id = current_user.id if current_user else None
    item = await ItemCRUD.get_by_id(db, item_id, current_user_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or access denied",
        )

    return item


def require_item_permission(permission: str) -> Callable:
    """Factory for item permission dependencies"""

    async def permission_checker(
        item: dict = Depends(get_valid_item),
        current_user: Optional[CurrentUser] = OptionalAuth,
    ) -> dict:
        if not item.get(f"can_{permission}", False):
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You don't have permission to {permission} this item",
                )

        return item

    return permission_checker


def require_item_ownership() -> Callable:
    """Dependency for requiring item ownership"""

    async def ownership_checker(
        item: dict = Depends(get_valid_item), current_user: CurrentUser = RequireAuth
    ) -> dict:
        if item.get("owner_id") != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own appointments",
            )

        return item

    return ownership_checker


# ================================
# Item-Specific Query Parameters
# ================================


async def get_item_filters(
    category: Optional[ItemCategory] = Query(None, description="Filter by category"),
    status: Optional[appointmentstatus] = Query(None, description="Filter by status"),
    owner_id: Optional[UUID] = Query(None, description="Filter by owner ID"),
    is_public: Optional[bool] = Query(None, description="Filter by public visibility"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    # Use global search and date filters
    search_params: dict = SearchParams,
    filter_params: dict = FilterParams,
) -> ItemFilters:
    """Parse and validate item filters from query parameters"""

    # Parse tags
    parsed_tags = None
    if tags:
        parsed_tags = [tag.strip() for tag in tags.split(",") if tag.strip()]

    return ItemFilters(
        category=category,
        status=status,
        owner_id=owner_id,
        is_public=is_public,
        min_price=min_price,
        max_price=max_price,
        tags=parsed_tags,
        search=search_params.get("search"),
        created_after=filter_params.get("created_after"),
        created_before=filter_params.get("created_before"),
    )


async def get_item_pagination(
    sort: appointmentsortOptions = Query(
        appointmentsortOptions.CREATED_DESC, description="Sort order"
    ),
    pagination: dict = CommonPagination,
) -> dict:
    """Get item-specific pagination with sorting"""

    return {"page": pagination["page"], "size": pagination["size"], "sort": sort}


# ================================
# Convenience Dependencies
# ================================

# Specific permission dependencies using the factories above
RequireItemUpdate = Depends(require_item_permission("update"))
RequireItemDelete = Depends(require_item_permission("delete"))
RequireItemComment = Depends(require_item_permission("comment"))
RequireItemOwnership = Depends(require_item_ownership())

# Admin access for appointments (uses global admin dependency)
RequireItemAdmin = Depends(get_admin_user)


# ================================
# Item-Specific Validation Helpers
# ================================


async def validate_item_status_transition(
    current_status: appointmentstatus,
    new_status: appointmentstatus,
    current_user: CurrentUser,
) -> bool:
    """Validate if status transition is allowed"""

    # Define allowed transitions
    allowed_transitions = {
        appointmentstatus.DRAFT: [
            appointmentstatus.PUBLISHED,
            appointmentstatus.ARCHIVED,
            appointmentstatus.DELETED,
        ],
        appointmentstatus.PUBLISHED: [
            appointmentstatus.DRAFT,
            appointmentstatus.ARCHIVED,
            appointmentstatus.DELETED,
        ],
        appointmentstatus.ARCHIVED: [
            appointmentstatus.DRAFT,
            appointmentstatus.PUBLISHED,
            appointmentstatus.DELETED,
        ],
        appointmentstatus.DELETED: [],  # Deleted appointments cannot be transitioned
    }

    # Check if transition is allowed
    if new_status not in allowed_transitions.get(current_status, []):
        return False

    # Additional business rules
    if new_status == appointmentstatus.PUBLISHED:
        # Only verified users can publish appointments
        if not current_user.is_verified:
            return False

    return True


async def track_item_view(
    item: dict = Depends(get_valid_item),
    current_user: Optional[CurrentUser] = OptionalAuth,
    db: Database = Depends(get_db),
) -> dict:
    """Track item view for analytics"""

    import uuid
    from datetime import datetime, timezone

    from sqlalchemy import insert

    from app.appointments.models import item_views

    # Record the view
    view_data = {
        "id": uuid.uuid4(),
        "item_id": item["id"],
        "viewer_id": current_user.id if current_user else None,
        "viewed_at": datetime.now(timezone.utc),
        "metadata": {},
    }

    try:
        query = insert(item_views).values(**view_data)
        await db.execute(query)
    except Exception:
        # Don't fail the request if view tracking fails
        pass

    return item
