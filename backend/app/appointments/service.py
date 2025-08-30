"""
Item service layer for business logic
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from databases import Database
from fastapi import HTTPException, status

from app.appointments.crud import ItemCRUD
from app.appointments.schemas import (
    ItemCreate,
    ItemUpdate,
    ItemFilters,
    PaginationParams,
    BulkItemOperation,
    BulkOperationResult,
    appointmentstatusUpdate,
    CommentCreate,
    CommentUpdate,
    ItemPermissionCreate,
)
from app.appointments.models import (
    appointmentstatus,
    appointments,
    item_comments,
    item_favorites,
    item_permissions,
)
from app.appointments.dependencies import validate_item_status_transition
from app.auth.dependencies import CurrentUser
from sqlalchemy import insert, update, delete, select, and_, func


class appointmentservice:
    """Service layer for item operations"""

    @staticmethod
    async def create_item(
        db: Database, item_data: ItemCreate, owner: CurrentUser
    ) -> Dict[str, Any]:
        """Create a new item with business logic validation"""

        # Validate user can create appointments
        if not owner.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only verified users can create appointments",
            )

        # Business rule: Published appointments require admin approval for new users
        if (
            item_data.status == appointmentstatus.PUBLISHED
            and not owner.is_admin
            and await appointmentservice._is_new_user(db, owner.id)
        ):
            # Auto-change to draft for new users
            item_data.status = appointmentstatus.DRAFT

        # Create the item
        item = await ItemCRUD.create(db, item_data, owner.id)

        # Log item creation
        await appointmentservice._log_item_activity(
            db, item["id"], owner.id, "created", {"status": item_data.status.value}
        )

        return item

    @staticmethod
    async def update_item(
        db: Database, item_id: UUID, item_data: ItemUpdate, current_user: CurrentUser
    ) -> Optional[Dict[str, Any]]:
        """Update an item with business logic validation"""

        # Get current item
        current_item = await ItemCRUD.get_by_id(db, item_id, current_user.id)
        if not current_item:
            return None

        # Validate status transition if status is being changed
        if item_data.status and item_data.status != current_item["status"]:
            is_valid_transition = await validate_item_status_transition(
                current_item["status"], item_data.status, current_user
            )

            if not is_valid_transition:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status transition from {current_item['status']} to {item_data.status}",
                )

        # Update the item
        updated_item = await ItemCRUD.update(db, item_id, item_data, current_user.id)

        if updated_item:
            # Log item update
            changes = {
                k: v
                for k, v in item_data.model_dump(exclude_unset=True).appointments()
                if v is not None
            }
            await appointmentservice._log_item_activity(
                db, item_id, current_user.id, "updated", {"changes": changes}
            )

        return updated_item

    @staticmethod
    async def delete_item(
        db: Database, item_id: UUID, current_user: CurrentUser, soft_delete: bool = True
    ) -> bool:
        """Delete an item with business logic"""

        # Get current item
        current_item = await ItemCRUD.get_by_id(db, item_id, current_user.id)
        if not current_item:
            return False

        # Business rule: Published appointments with comments require admin approval to delete
        if (
            current_item["status"] == appointmentstatus.PUBLISHED
            and current_item["comment_count"] > 0
            and not current_user.is_admin
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Published appointments with comments can only be deleted by admins",
            )

        # Delete the item
        success = await ItemCRUD.delete(db, item_id, current_user.id, soft_delete)

        if success:
            # Log item deletion
            await appointmentservice._log_item_activity(
                db,
                item_id,
                current_user.id,
                "deleted",
                {
                    "soft_delete": soft_delete,
                    "comment_count": current_item["comment_count"],
                },
            )

        return success

    @staticmethod
    async def get_item_list(
        db: Database,
        filters: ItemFilters,
        pagination: PaginationParams,
        current_user: Optional[CurrentUser] = None,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Get paginated item list with metadata"""

        current_user_id = current_user.id if current_user else None

        # Get appointments and total count
        appointments_list, total = await ItemCRUD.get_list(
            db, filters, pagination, current_user_id
        )

        # Calculate pagination metadata
        pages = (total + pagination.size - 1) // pagination.size
        has_next = pagination.page < pages
        has_prev = pagination.page > 1

        metadata = {
            "total": total,
            "page": pagination.page,
            "size": pagination.size,
            "pages": pages,
            "has_next": has_next,
            "has_prev": has_prev,
        }

        return appointments_list, metadata

    @staticmethod
    async def bulk_operation(
        db: Database, operation_data: BulkItemOperation, current_user: CurrentUser
    ) -> BulkOperationResult:
        """Perform bulk operations on appointments"""

        result = BulkOperationResult(
            total_appointments=len(operation_data.item_ids),
            successful_appointments=0,
            failed_appointments=0,
            operation=operation_data.operation,
        )

        for item_id in operation_data.item_ids:
            try:
                # Get item and check permissions
                item = await ItemCRUD.get_by_id(db, item_id, current_user.id)

                if not item:
                    result.failed_appointments += 1
                    result.errors.append(
                        {
                            "item_id": str(item_id),
                            "error": "Item not found or access denied",
                        }
                    )
                    continue

                # Check permission based on operation
                required_permission = (
                    "update" if operation_data.operation != "delete" else "delete"
                )
                if not item.get(f"can_{required_permission}", False):
                    result.failed_appointments += 1
                    result.errors.append(
                        {
                            "item_id": str(item_id),
                            "error": f"Permission denied for {operation_data.operation}",
                        }
                    )
                    continue

                # Perform operation
                success = await appointmentservice._perform_bulk_operation(
                    db, item_id, operation_data.operation, current_user.id
                )

                if success:
                    result.successful_appointments += 1
                else:
                    result.failed_appointments += 1
                    result.errors.append(
                        {
                            "item_id": str(item_id),
                            "error": f"Failed to {operation_data.operation} item",
                        }
                    )

            except Exception as e:
                result.failed_appointments += 1
                result.errors.append({"item_id": str(item_id), "error": str(e)})

        # Log bulk operation
        await appointmentservice._log_item_activity(
            db,
            None,
            current_user.id,
            f"bulk_{operation_data.operation}",
            {
                "total_appointments": result.total_appointments,
                "successful_appointments": result.successful_appointments,
                "failed_appointments": result.failed_appointments,
                "reason": operation_data.reason,
            },
        )

        return result

    @staticmethod
    async def toggle_favorite(
        db: Database, item_id: UUID, current_user: CurrentUser
    ) -> Dict[str, Any]:
        """Toggle item favorite status for user"""

        # Check if item exists and is accessible
        item = await ItemCRUD.get_by_id(db, item_id, current_user.id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found or access denied",
            )

        # Check if already favorited
        existing_favorite_query = select(item_favorites).where(
            and_(
                item_favorites.c.item_id == item_id,
                item_favorites.c.user_id == current_user.id,
            )
        )
        existing_favorite = await db.fetch_one(existing_favorite_query)

        if existing_favorite:
            # Remove favorite
            delete_query = delete(item_favorites).where(
                item_favorites.c.id == existing_favorite["id"]
            )
            await db.execute(delete_query)
            is_favorited = False
            action = "unfavorited"
        else:
            # Add favorite
            import uuid

            favorite_data = {
                "id": uuid.uuid4(),
                "item_id": item_id,
                "user_id": current_user.id,
                "created_at": datetime.now(timezone.utc),
            }
            insert_query = insert(item_favorites).values(**favorite_data)
            await db.execute(insert_query)
            is_favorited = True
            action = "favorited"

        # Get updated favorite count
        count_query = (
            select(func.count())
            .select_from(item_favorites)
            .where(item_favorites.c.item_id == item_id)
        )
        favorite_count = await db.fetch_val(count_query) or 0

        # Log activity
        await appointmentservice._log_item_activity(
            db, item_id, current_user.id, action, {"favorite_count": favorite_count}
        )

        return {
            "item_id": item_id,
            "is_favorited": is_favorited,
            "favorite_count": favorite_count,
            "action": action,
        }

    @staticmethod
    async def _is_new_user(db: Database, user_id: UUID) -> bool:
        """Check if user is considered new (created less than 7 days ago)"""

        from app.auth.models import users
        from datetime import timedelta

        user_query = select(users.c.created_at).where(users.c.id == user_id)
        user_created = await db.fetch_val(user_query)

        if not user_created:
            return True

        # Make user_created timezone-aware if it's naive
        if user_created.tzinfo is None:
            user_created = user_created.replace(tzinfo=timezone.utc)

        days_since_creation = (datetime.now(timezone.utc) - user_created).days
        return days_since_creation < 7

    @staticmethod
    async def _perform_bulk_operation(
        db: Database, item_id: UUID, operation: str, user_id: UUID
    ) -> bool:
        """Perform individual bulk operation"""

        try:
            if operation == "delete":
                query = (
                    update(appointments)
                    .where(appointments.c.id == item_id)
                    .values(
                        deleted_at=datetime.now(timezone.utc),
                        deleted_by=user_id,
                        status=appointmentstatus.DELETED,
                    )
                )
            elif operation == "archive":
                query = (
                    update(appointments)
                    .where(appointments.c.id == item_id)
                    .values(
                        status=appointmentstatus.ARCHIVED,
                        archived_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                )
            elif operation == "publish":
                query = (
                    update(appointments)
                    .where(appointments.c.id == item_id)
                    .values(
                        status=appointmentstatus.PUBLISHED,
                        published_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                )
            elif operation == "draft":
                query = (
                    update(appointments)
                    .where(appointments.c.id == item_id)
                    .values(
                        status=appointmentstatus.DRAFT,
                        updated_at=datetime.now(timezone.utc),
                    )
                )
            else:
                return False

            result = await db.execute(query)
            return result > 0

        except Exception:
            return False

    @staticmethod
    async def _log_item_activity(
        db: Database,
        item_id: Optional[UUID],
        user_id: UUID,
        action: str,
        metadata: Dict[str, Any],
    ):
        """Log item activity for audit purposes"""

        # This would typically log to an audit table
        # For now, we'll just pass - implement based on your audit requirements
        pass


class ItemCommentService:
    """Service layer for item comments"""

    @staticmethod
    async def create_comment(
        db: Database, item_id: UUID, comment_data: CommentCreate, author: CurrentUser
    ) -> Dict[str, Any]:
        """Create a new comment on an item"""

        import uuid

        # Validate parent comment if specified
        if comment_data.parent_comment_id:
            parent_query = select(item_comments).where(
                and_(
                    item_comments.c.id == comment_data.parent_comment_id,
                    item_comments.c.item_id == item_id,
                    item_comments.c.deleted_at.is_(None),
                )
            )
            parent_comment = await db.fetch_one(parent_query)

            if not parent_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found",
                )

        # Create comment
        comment_id = uuid.uuid4()
        comment_insert_data = {
            "id": comment_id,
            "item_id": item_id,
            "author_id": author.id,
            "content": comment_data.content,
            "parent_comment_id": comment_data.parent_comment_id,
            "is_approved": True,  # Auto-approve for now
            "created_at": datetime.now(timezone.utc),
        }

        query = insert(item_comments).values(**comment_insert_data)
        await db.execute(query)

        # Get the created comment with author info
        comment_query = select(
            item_comments.c.id,
            item_comments.c.item_id,
            item_comments.c.author_id,
            item_comments.c.content,
            item_comments.c.parent_comment_id,
            item_comments.c.is_approved,
            item_comments.c.created_at,
            item_comments.c.updated_at,
        ).where(item_comments.c.id == comment_id)

        comment = await db.fetch_one(comment_query)
        return dict(comment) if comment else {}

    @staticmethod
    async def get_item_comments(
        db: Database, item_id: UUID, current_user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """Get all comments for an item"""

        from app.auth.models import users

        # Get comments with author info
        query = (
            select(
                item_comments.c.id,
                item_comments.c.item_id,
                item_comments.c.author_id,
                item_comments.c.content,
                item_comments.c.parent_comment_id,
                item_comments.c.is_approved,
                item_comments.c.created_at,
                item_comments.c.updated_at,
                users.c.first_name.label("author_first_name"),
                users.c.last_name.label("author_last_name"),
            )
            .select_from(
                item_comments.join(users, item_comments.c.author_id == users.c.id)
            )
            .where(
                and_(
                    item_comments.c.item_id == item_id,
                    item_comments.c.deleted_at.is_(None),
                    item_comments.c.is_approved == True,
                )
            )
            .order_by(item_comments.c.created_at.asc())
        )

        results = await db.fetch_all(query)

        comments = []
        for result in results:
            comment_dict = dict(result)

            # Add permission flags
            comment_dict["can_update"] = current_user_id == comment_dict["author_id"]
            comment_dict["can_delete"] = current_user_id == comment_dict["author_id"]

            # Format author info
            comment_dict["author"] = {
                "id": comment_dict["author_id"],
                "first_name": comment_dict["author_first_name"],
                "last_name": comment_dict["author_last_name"],
            }

            # Remove individual author fields
            comment_dict.pop("author_first_name", None)
            comment_dict.pop("author_last_name", None)

            comments.append(comment_dict)

        return comments
