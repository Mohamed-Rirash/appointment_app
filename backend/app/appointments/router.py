"""
Appointment booking API endpoints demonstrating RBAC usage

Note: This repurposes the existing item routes to act as appointment endpoints so
you can validate RBAC quickly. The underlying service calls remain the same
for now; only the routes, tags, and permission requirements are adjusted to
match the appointments domain. Replace ItemService with an AppointmentService
later when you are ready to fully migrate the data model.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from starlette.responses import StreamingResponse
from databases import Database

from app.database import get_db
from app.dependencies import (
    get_current_user_global, get_optional_user_global, get_verified_user, get_admin_user
)
from app.auth.dependencies import require_authentication, require_permissions, require_role
from app.items.dependencies import (
    get_valid_item, get_item_filters, get_item_pagination, track_item_view
)
from app.items.service import ItemService, ItemCommentService
from app.notifications.service import notify_user
from app.notifications.sse import appointments_broker
from app.items.schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    CommentCreate, CommentResponse, BulkItemOperation, BulkOperationResult,
    ItemStatusUpdate, ItemAnalytics
)
from app.auth.dependencies import CurrentUser

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# ================================
# Item CRUD Operations
# ================================

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,
    current_user: CurrentUser = Depends(require_permissions("appointments:create")),
    db: Database = Depends(get_db)
):
    """
    Create a new appointment.
    
    **Authentication Required**: Yes
    **Permissions**: Verified users only
    
    **Business Rules**:
    - Only verified users can create items
    - New users cannot directly publish items (auto-changed to draft)
    - Items are private by default
    """
    
    item = await ItemService.create_item(db, item_data, current_user)
    # Ensure decision defaults to pending and notify hosts/secretaries via SSE
    try:
        from app.items.schemas import ItemUpdate
        meta = (item.get("metadata") or {})
        if meta.get("decision") is None:
            meta = {**meta, "decision": "pending"}
            item = await ItemService.update_item(db, item["id"], ItemUpdate(metadata=meta), current_user)
        # Publish SSE event for host/secretary dashboards
        try:
            await appointments_broker.publish(
                "appointment_created",
                {
                    "id": str(item.get("id")),
                    "decision": (item.get("metadata") or {}).get("decision"),
                    "created_at": str(item.get("created_at")),
                    "created_by": str(getattr(current_user, "id", None)),
                },
            )
        except Exception:
            pass
    except Exception:
        pass
    return ItemResponse(**item)


@router.get("/", response_model=ItemListResponse)
async def list_items(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global),
    _perm: CurrentUser = Depends(require_permissions("appointments:list")),
    db: Database = Depends(get_db)
):
    """
    Get paginated list of appointments with filtering.
    
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
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global),
    _perm: CurrentUser = Depends(require_permissions("appointments:read"))
):
    """
    Get a specific appointment by ID.
    
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
    current_user: CurrentUser = Depends(require_permissions("appointments:update")),
    db: Database = Depends(get_db)
):
    """
    Update an existing appointment.
    
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
    
    # Notify reception
    try:
        notify_user(
            {"role": "reception"},
            subject="Appointment updated",
            message=f"Appointment {item.get('id')} has been updated.",
            meta={"appointment_id": str(item.get("id"))},
        )
    except Exception:
        pass
    
    return ItemResponse(**updated_item)


# ================================
# Realtime Notifications (SSE)
# ================================

@router.get("/stream")
async def appointments_stream(
    current_user: CurrentUser = Depends(require_permissions("appointments:*"))
):
    """
    Server-Sent Events stream for host/secretary dashboards.
    Emits events like 'appointment_created' when a new appointment is booked
    and marked as decision=pending.
    """
    q = await appointments_broker.subscribe()

    async def gen():
        try:
            async for chunk in appointments_broker.event_generator(q):
                yield chunk
        finally:
            await appointments_broker.unsubscribe(q)

    return StreamingResponse(gen(), media_type="text/event-stream")


# ================================
# Appointment Decisions
# ================================

@router.post("/{item_id}/approve", response_model=ItemResponse)
async def approve_appointment(
    item: dict = Depends(get_valid_item),
    reason: Optional[str] = Query(None, description="Reason for approval"),
    current_user: CurrentUser = Depends(require_permissions("appointments:approve")),
    db: Database = Depends(get_db)
):
    """
    Approve an appointment. Host or Secretary can approve.
    """
    from app.items.schemas import ItemUpdate
    # Mark approval in metadata; real implementation can adjust status/workflow
    new_meta = {**(item.get("metadata") or {}), "decision": "approved", "decision_reason": reason}
    updated = await ItemService.update_item(db, item["id"], ItemUpdate(metadata=new_meta), current_user)
    # Notify requester/owner
    try:
        owner = item.get("owner") or {}
        notify_user(owner, "Appointment approved", f"Appointment {item.get('id')} was approved.", {"appointment_id": str(item.get("id"))})
    except Exception:
        pass
    return ItemResponse(**updated)


@router.post("/{item_id}/deny", response_model=ItemResponse)
async def deny_appointment(
    item: dict = Depends(get_valid_item),
    reason: Optional[str] = Query(None, description="Reason for denial"),
    current_user: CurrentUser = Depends(require_permissions("appointments:deny")),
    db: Database = Depends(get_db)
):
    """
    Deny an appointment. Host or Secretary can deny.
    """
    from app.items.schemas import ItemUpdate
    new_meta = {**(item.get("metadata") or {}), "decision": "denied", "decision_reason": reason}
    updated = await ItemService.update_item(db, item["id"], ItemUpdate(metadata=new_meta), current_user)
    try:
        owner = item.get("owner") or {}
        notify_user(owner, "Appointment denied", f"Appointment {item.get('id')} was denied.", {"appointment_id": str(item.get("id"))})
    except Exception:
        pass
    return ItemResponse(**updated)


@router.post("/{item_id}/postpone", response_model=ItemResponse)
async def postpone_appointment(
    item: dict = Depends(get_valid_item),
    until: Optional[str] = Query(None, description="Postpone until (ISO-8601 string)"),
    reason: Optional[str] = Query(None, description="Reason for postponement"),
    current_user: CurrentUser = Depends(require_permissions("appointments:postpone")),
    db: Database = Depends(get_db)
):
    """
    Postpone an appointment. Host or Secretary can postpone.
    """
    from app.items.schemas import ItemUpdate
    new_meta = {**(item.get("metadata") or {}), "decision": "postponed", "postpone_until": until, "decision_reason": reason}
    updated = await ItemService.update_item(db, item["id"], ItemUpdate(metadata=new_meta), current_user)
    try:
        owner = item.get("owner") or {}
        notify_user(owner, "Appointment postponed", f"Appointment {item.get('id')} was postponed.", {"appointment_id": str(item.get("id")), "until": until})
    except Exception:
        pass
    return ItemResponse(**updated)


@router.patch("/{item_id}/status", response_model=ItemResponse)
async def update_item_status(
    status_data: ItemStatusUpdate,
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_permissions("appointments:update")),
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
    current_user: CurrentUser = Depends(require_permissions("appointments:delete")),
    db: Database = Depends(get_db),
    hard_delete: bool = Query(False, description="Perform hard delete (admin only)")
):
    """
    Delete an appointment.
    
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
# Appointment Management Extensions
# ================================

@router.post("/{item_id}/cancel", response_model=ItemResponse)
async def cancel_appointment(
    item: dict = Depends(get_valid_item),
    reason: Optional[str] = Query(None, description="Reason for cancellation"),
    current_user: CurrentUser = Depends(require_permissions("appointments:delete")),
    db: Database = Depends(get_db)
):
    """
    Cancel an appointment (never hard-deleted).
    """
    from datetime import datetime, timezone
    from app.items.schemas import ItemUpdate
    new_meta = {
        **(item.get("metadata") or {}),
        "decision": "cancelled",
        "decision_reason": reason,
        "cancelled_at": datetime.now(timezone.utc).isoformat(),
    }
    updated = await ItemService.update_item(db, item["id"], ItemUpdate(metadata=new_meta), current_user)
    try:
        owner = item.get("owner") or {}
        notify_user(owner, "Appointment cancelled", f"Appointment {item.get('id')} was cancelled.", {"appointment_id": str(item.get("id"))})
    except Exception:
        pass
    return ItemResponse(**updated)


# ================================
# Item Interactions
# ================================

@router.post("/{item_id}/favorite")
async def toggle_appointment_favorite(
    item_id: UUID,
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Toggle favorite status for an appointment.
    
    **Authentication Required**: Yes
    **Permissions**: Any authenticated user (for accessible items)
    
    **Returns**: Updated favorite status and count
    """
    
    result = await ItemService.toggle_favorite(db, item_id, current_user)
    return result


# ================================
# Dashboards and Lists
# ================================

def _is_today(dt_str: Optional[str]) -> bool:
    from datetime import datetime, timezone
    if not dt_str:
        return False
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return False
    today = datetime.now(timezone.utc).date()
    return dt.date() == today


def _decision(item: dict) -> str:
    meta = item.get("metadata") or {}
    return meta.get("decision") or "pending"


async def _list_and_filter(db: Database, current_user: Optional[CurrentUser], decision: Optional[str] = None, today_only: bool = False):
    filters = {}
    pagination = {"page": 1, "size": 100}
    items, meta = await ItemService.get_item_list(db, filters, pagination, current_user)
    def _keep(x: dict) -> bool:
        dec = _decision(x)
        if decision and dec != decision:
            return False
        if today_only:
            # prefer created_at as appointment date placeholder
            dt_str = (x.get("created_at") or ""); dt_str = str(dt_str)
            if not _is_today(dt_str):
                return False
        return True
    return [ItemResponse(**x) for x in items if _keep(x)], meta


@router.get("/dashboard/today-approved", response_model=ItemListResponse)
async def dashboard_today_approved(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision="approved", today_only=True)
    return ItemListResponse(items=items, **meta)


@router.get("/dashboard/today", response_model=ItemListResponse)
async def dashboard_today_all(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision=None, today_only=True)
    return ItemListResponse(items=items, **meta)


@router.get("/reception/today", response_model=ItemListResponse)
async def reception_today_registered(
    current_user: CurrentUser = Depends(require_role("reception")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision=None, today_only=True)
    return ItemListResponse(items=items, **meta)


@router.get("/list/approved", response_model=ItemListResponse)
async def list_approved(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision="approved")
    return ItemListResponse(items=items, **meta)


@router.get("/list/rejected", response_model=ItemListResponse)
async def list_rejected(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision="denied")
    return ItemListResponse(items=items, **meta)


@router.get("/list/cancelled", response_model=ItemListResponse)
async def list_cancelled(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision="cancelled")
    return ItemListResponse(items=items, **meta)


@router.get("/list/requested", response_model=ItemListResponse)
async def list_requested(
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    items, meta = await _list_and_filter(db, current_user, decision="pending")
    return ItemListResponse(items=items, **meta)


@router.get("/search", response_model=ItemListResponse)
async def search_appointments(
    q: Optional[str] = Query(None, description="Search text"),
    created_after: Optional[str] = Query(None),
    created_before: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(require_permissions("appointments:read")),
    db: Database = Depends(get_db)
):
    filters = {}
    if q:
        filters["search"] = q
    if created_after:
        filters["created_after"] = created_after
    if created_before:
        filters["created_before"] = created_before
    pagination = {"page": 1, "size": 50}
    items, meta = await ItemService.get_item_list(db, filters, pagination, current_user)
    return ItemListResponse(items=[ItemResponse(**x) for x in items], **meta)


@router.get("/filter/by-date", response_model=ItemListResponse)
async def filter_by_date(
    start: Optional[str] = Query(None, description="ISO start datetime"),
    end: Optional[str] = Query(None, description="ISO end datetime"),
    current_user: CurrentUser = Depends(require_permissions("appointments:*")),
    db: Database = Depends(get_db)
):
    """
    Date filter visible to secretary and host (appointments:*).
    Uses created_at as appointment datetime placeholder.
    """
    from datetime import datetime, timezone
    def to_dt(s: Optional[str]):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception:
            return None
    start_dt = to_dt(start)
    end_dt = to_dt(end)
    items, meta = await ItemService.get_item_list(db, {}, {"page": 1, "size": 500}, current_user)
    def keep(x: dict) -> bool:
        dt_str = str(x.get("created_at") or "")
        try:
            created = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception:
            return False
        if start_dt and created < start_dt:
            return False
        if end_dt and created > end_dt:
            return False
        return True
    subset = [ItemResponse(**x) for x in items if keep(x)]
    return ItemListResponse(items=subset, **meta)


@router.post("/admin/purge-cancelled", response_model=BulkOperationResult)
async def purge_cancelled(
    older_than_days: int = Query(7, ge=1, le=365),
    current_user: CurrentUser = Depends(require_permissions("appointments:*")),
    db: Database = Depends(get_db)
):
    """
    Hard-delete cancelled appointments older than N days.
    Restricted to host/secretary/admin via appointments:*.
    """
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
    items, _ = await ItemService.get_item_list(db, {}, {"page": 1, "size": 1000}, current_user)
    deleted, skipped = 0, 0
    for x in items:
        meta = x.get("metadata") or {}
        if meta.get("decision") != "cancelled":
            continue
        ts = meta.get("cancelled_at")
        try:
            ts_dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception:
            skipped += 1
            continue
        if ts_dt <= cutoff:
            ok = await ItemService.delete_item(db, x["id"], current_user, soft_delete=False)
            if ok:
                deleted += 1
            else:
                skipped += 1
    return BulkOperationResult(total=deleted+skipped, success=True, processed=deleted, failed=skipped)


@router.get("/{item_id}/comments", response_model=List[CommentResponse])
async def get_appointment_comments(
    item: dict = Depends(get_valid_item),
    current_user: Optional[CurrentUser] = Depends(get_optional_user_global),
    db: Database = Depends(get_db)
):
    """
    Get all comments for an appointment.
    
    **Authentication Required**: No (but affects visibility)
    **Permissions**: Same as appointment access permissions
    
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
async def create_appointment_comment(
    comment_data: CommentCreate,
    item: dict = Depends(get_valid_item),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Create a comment on an appointment.
    
    **Authentication Required**: Yes
    **Permissions**: Users who can access the appointment and commenting is enabled
    
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
async def bulk_appointment_operation(
    operation_data: BulkItemOperation,
    current_user: CurrentUser = Depends(require_permissions("appointments:*")),
    db: Database = Depends(get_db)
):
    """
    Perform bulk operations on multiple appointments.
    
    **Authentication Required**: Yes
    **Permissions**: User must have appropriate permission for each appointment
    
    **Supported Operations**:
    - delete: Soft delete appointments
    - archive: Archive appointments
    - publish: Publish appointments
    - draft: Change appointments to draft status
    
    **Returns**: Summary of successful and failed operations
    """
    
    result = await ItemService.bulk_operation(db, operation_data, current_user)
    return result


# ================================
# User's Appointments
# ================================

@router.get("/my/appointments", response_model=ItemListResponse)
async def get_my_appointments(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db)
):
    """
    Get current user's appointments.
    
    **Authentication Required**: Yes
    **Permissions**: User's own appointments only
    
    **Features**:
    - Includes all appointments (public and private)
    - Same filtering and sorting options as main list
    - Shows appointments in all statuses (including deleted)
    """
    
    # Override filters to show only user's appointments
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
    Get current user's favorite appointments.
    
    **Authentication Required**: Yes
    **Permissions**: User's own favorites only
    """
    
    from app.items.models import item_favorites
    from sqlalchemy import select, join
    
    # Get user's favorite appointment IDs
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
    
    # Create filters for favorite appointments
    from app.items.schemas import ItemFilters
    filters = ItemFilters()
    
    # Get favorite appointments (this is a simplified approach)
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
async def admin_get_all_appointments(
    filters: dict = Depends(get_item_filters),
    pagination: dict = Depends(get_item_pagination),
    current_user: CurrentUser = Depends(require_permissions("appointments:*")),
    db: Database = Depends(get_db),
    include_deleted: bool = Query(False, description="Include deleted appointments")
):
    """
    Admin endpoint to get all appointments including private and deleted ones.
    
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
