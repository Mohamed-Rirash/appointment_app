"""
Item CRUD operations with authentication and authorization
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID

from databases import Database
from sqlalchemy import select, insert, update, delete, func, and_, or_, desc, asc, text
from sqlalchemy.sql import Select

from app.appointments.models import (
    appointments,
    item_comments,
    item_favorites,
    item_views,
    item_permissions,
    appointmentstatus,
    ItemCategory,
)
from app.appointments.schemas import (
    ItemCreate,
    ItemUpdate,
    ItemFilters,
    PaginationParams,
    appointmentsortOptions,
    CommentCreate,
    CommentUpdate,
    ItemPermissionCreate,
)
from app.auth.models import users


class ItemCRUD:
    """CRUD operations for appointments with permission checking"""

    @staticmethod
    async def create(
        db: Database, item_data: ItemCreate, owner_id: UUID
    ) -> Dict[str, Any]:
        """Create a new item"""

        item_id = uuid.uuid4()

        # Prepare item data
        create_data = item_data.model_dump()
        create_data.update(
            {
                "id": item_id,
                "owner_id": owner_id,
                "created_at": datetime.now(timezone.utc),
            }
        )

        # Set published_at if status is published
        if create_data.get("status") == appointmentstatus.PUBLISHED:
            create_data["published_at"] = datetime.now(timezone.utc)

        query = insert(appointments).values(**create_data)
        await db.execute(query)

        # Return the created item
        return await ItemCRUD.get_by_id(db, item_id, owner_id)

    @staticmethod
    async def get_by_id(
        db: Database,
        item_id: UUID,
        current_user_id: Optional[UUID] = None,
        include_deleted: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Get item by ID with permission checking"""

        # Base query with owner information
        query = (
            select(
                appointments.c.id,
                appointments.c.title,
                appointments.c.description,
                appointments.c.category,
                appointments.c.status,
                appointments.c.price,
                appointments.c.quantity,
                appointments.c.sku,
                appointments.c.tags,
                appointments.c.metadata,
                appointments.c.owner_id,
                appointments.c.is_public,
                appointments.c.allow_comments,
                appointments.c.created_at,
                appointments.c.updated_at,
                appointments.c.published_at,
                appointments.c.archived_at,
                appointments.c.deleted_at,
                users.c.first_name.label("owner_first_name"),
                users.c.last_name.label("owner_last_name"),
                users.c.email.label("owner_email"),
            )
            .select_from(
                appointments.join(users, appointments.c.owner_id == users.c.id)
            )
            .where(appointments.c.id == item_id)
        )

        # Filter out deleted appointments unless explicitly requested
        if not include_deleted:
            query = query.where(appointments.c.deleted_at.is_(None))

        result = await db.fetch_one(query)
        if not result:
            return None

        item_dict = dict(result)

        # Check if user can access this item
        can_access = await ItemCRUD._can_access_item(db, item_dict, current_user_id)

        if not can_access:
            return None

        # Add computed fields
        item_dict.update(await ItemCRUD._get_item_stats(db, item_id, current_user_id))
        item_dict.update(
            await ItemCRUD._get_item_permissions(
                db, item_id, current_user_id, item_dict
            )
        )

        # Format owner information
        item_dict["owner"] = {
            "id": item_dict["owner_id"],
            "first_name": item_dict["owner_first_name"],
            "last_name": item_dict["owner_last_name"],
            "email": item_dict["owner_email"],
        }

        # Remove individual owner fields
        for key in ["owner_first_name", "owner_last_name", "owner_email"]:
            item_dict.pop(key, None)

        return item_dict

    @staticmethod
    async def get_list(
        db: Database,
        filters: ItemFilters,
        pagination: PaginationParams,
        current_user_id: Optional[UUID] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get paginated list of appointments with filtering"""

        # Base query
        base_query = select(appointments).select_from(
            appointments.join(users, appointments.c.owner_id == users.c.id)
        )

        # Apply filters
        conditions = [
            appointments.c.deleted_at.is_(None)
        ]  # Exclude deleted appointments

        # Access control: show public appointments or owned appointments
        if current_user_id:
            conditions.append(
                or_(
                    appointments.c.is_public == True,
                    appointments.c.owner_id == current_user_id,
                )
            )
        else:
            conditions.append(appointments.c.is_public == True)

        # Apply user filters
        if filters.category:
            conditions.append(appointments.c.category == filters.category)

        if filters.status:
            conditions.append(appointments.c.status == filters.status)

        if filters.owner_id:
            conditions.append(appointments.c.owner_id == filters.owner_id)

        if filters.is_public is not None:
            conditions.append(appointments.c.is_public == filters.is_public)

        if filters.min_price is not None:
            conditions.append(appointments.c.price >= filters.min_price)

        if filters.max_price is not None:
            conditions.append(appointments.c.price <= filters.max_price)

        if filters.tags:
            # Search for appointments that have any of the specified tags
            tag_conditions = []
            for tag in filters.tags:
                tag_conditions.append(
                    func.json_array_length(
                        func.json_extract(appointments.c.tags, f'$[*] ? (@ == "{tag}")')
                    )
                    > 0
                )
            conditions.append(or_(*tag_conditions))

        if filters.search:
            search_term = f"%{filters.search}%"
            conditions.append(
                or_(
                    appointments.c.title.ilike(search_term),
                    appointments.c.description.ilike(search_term),
                )
            )

        if filters.created_after:
            conditions.append(appointments.c.created_at >= filters.created_after)

        if filters.created_before:
            conditions.append(appointments.c.created_at <= filters.created_before)

        # Apply all conditions
        filtered_query = base_query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count()).select_from(filtered_query.alias())
        total = await db.fetch_val(count_query)

        # Apply sorting
        sort_column = appointments.c.created_at
        sort_direction = desc

        if pagination.sort == appointmentsortOptions.CREATED_ASC:
            sort_column, sort_direction = appointments.c.created_at, asc
        elif pagination.sort == appointmentsortOptions.UPDATED_DESC:
            sort_column, sort_direction = appointments.c.updated_at, desc
        elif pagination.sort == appointmentsortOptions.UPDATED_ASC:
            sort_column, sort_direction = appointments.c.updated_at, asc
        elif pagination.sort == appointmentsortOptions.TITLE_DESC:
            sort_column, sort_direction = appointments.c.title, desc
        elif pagination.sort == appointmentsortOptions.TITLE_ASC:
            sort_column, sort_direction = appointments.c.title, asc
        elif pagination.sort == appointmentsortOptions.PRICE_DESC:
            sort_column, sort_direction = appointments.c.price, desc
        elif pagination.sort == appointmentsortOptions.PRICE_ASC:
            sort_column, sort_direction = appointments.c.price, asc

        # Apply pagination and sorting
        paginated_query = (
            filtered_query.order_by(sort_direction(sort_column))
            .limit(pagination.size)
            .offset((pagination.page - 1) * pagination.size)
        )

        # Execute query
        results = await db.fetch_all(paginated_query)

        # Convert to list of dicts and add computed fields
        appointments_list = []
        for result in results:
            item_dict = dict(result)

            # Add computed fields
            item_dict.update(
                await ItemCRUD._get_item_stats(db, item_dict["id"], current_user_id)
            )
            item_dict.update(
                await ItemCRUD._get_item_permissions(
                    db, item_dict["id"], current_user_id, item_dict
                )
            )

            appointments_list.append(item_dict)

        return appointments_list, total

    @staticmethod
    async def update(
        db: Database, item_id: UUID, item_data: ItemUpdate, current_user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Update an item with permission checking"""

        # Check if item exists and user can update it
        existing_item = await ItemCRUD.get_by_id(db, item_id, current_user_id)
        if not existing_item:
            return None

        # Check update permission
        if not existing_item.get("can_update", False):
            return None

        # Prepare update data
        update_data = {
            k: v
            for k, v in item_data.model_dump(exclude_unset=True).appointments()
            if v is not None
        }

        if not update_data:
            return existing_item

        # Add updated timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)

        # Handle status changes
        if "status" in update_data:
            new_status = update_data["status"]
            old_status = existing_item["status"]

            if (
                new_status == appointmentstatus.PUBLISHED
                and old_status != appointmentstatus.PUBLISHED
            ):
                update_data["published_at"] = datetime.now(timezone.utc)
            elif (
                new_status == appointmentstatus.ARCHIVED
                and old_status != appointmentstatus.ARCHIVED
            ):
                update_data["archived_at"] = datetime.now(timezone.utc)

        # Execute update
        query = (
            update(appointments)
            .where(appointments.c.id == item_id)
            .values(**update_data)
        )
        await db.execute(query)

        # Return updated item
        return await ItemCRUD.get_by_id(db, item_id, current_user_id)

    @staticmethod
    async def delete(
        db: Database, item_id: UUID, current_user_id: UUID, soft_delete: bool = True
    ) -> bool:
        """Delete an item with permission checking"""

        # Check if item exists and user can delete it
        existing_item = await ItemCRUD.get_by_id(db, item_id, current_user_id)
        if not existing_item:
            return False

        # Check delete permission
        if not existing_item.get("can_delete", False):
            return False

        if soft_delete:
            # Soft delete
            query = (
                update(appointments)
                .where(appointments.c.id == item_id)
                .values(
                    deleted_at=datetime.now(timezone.utc),
                    deleted_by=current_user_id,
                    status=appointmentstatus.DELETED,
                )
            )
        else:
            # Hard delete
            query = delete(appointments).where(appointments.c.id == item_id)

        result = await db.execute(query)
        return result > 0

    @staticmethod
    async def _can_access_item(
        db: Database, item_dict: Dict[str, Any], current_user_id: Optional[UUID]
    ) -> bool:
        """Check if user can access an item"""

        # Public appointments are accessible to everyone
        if item_dict.get("is_public", False):
            return True

        # No user logged in and item is not public
        if not current_user_id:
            return False

        # Owner can always access their appointments
        if item_dict.get("owner_id") == current_user_id:
            return True

        # Check explicit permissions
        permission_query = select(item_permissions).where(
            and_(
                item_permissions.c.item_id == item_dict["id"],
                item_permissions.c.user_id == current_user_id,
                item_permissions.c.can_read == True,
                or_(
                    item_permissions.c.expires_at.is_(None),
                    item_permissions.c.expires_at > datetime.now(timezone.utc),
                ),
            )
        )

        permission = await db.fetch_one(permission_query)
        return permission is not None

    @staticmethod
    async def _get_item_stats(
        db: Database, item_id: UUID, current_user_id: Optional[UUID]
    ) -> Dict[str, Any]:
        """Get item statistics"""

        # View count
        view_count_query = (
            select(func.count())
            .select_from(item_views)
            .where(item_views.c.item_id == item_id)
        )
        view_count = await db.fetch_val(view_count_query) or 0

        # Comment count
        comment_count_query = (
            select(func.count())
            .select_from(item_comments)
            .where(
                and_(
                    item_comments.c.item_id == item_id,
                    item_comments.c.deleted_at.is_(None),
                )
            )
        )
        comment_count = await db.fetch_val(comment_count_query) or 0

        # Favorite count
        favorite_count_query = (
            select(func.count())
            .select_from(item_favorites)
            .where(item_favorites.c.item_id == item_id)
        )
        favorite_count = await db.fetch_val(favorite_count_query) or 0

        # Check if current user has favorited
        is_favorited = False
        if current_user_id:
            favorite_query = select(item_favorites).where(
                and_(
                    item_favorites.c.item_id == item_id,
                    item_favorites.c.user_id == current_user_id,
                )
            )
            favorite = await db.fetch_one(favorite_query)
            is_favorited = favorite is not None

        return {
            "view_count": view_count,
            "comment_count": comment_count,
            "favorite_count": favorite_count,
            "is_favorited": is_favorited,
        }

    @staticmethod
    async def _get_item_permissions(
        db: Database,
        item_id: UUID,
        current_user_id: Optional[UUID],
        item_dict: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Get user permissions for an item"""

        permissions = {"can_update": False, "can_delete": False, "can_comment": False}

        if not current_user_id:
            # Anonymous users can only comment on public appointments if allowed
            permissions["can_comment"] = item_dict.get(
                "is_public", False
            ) and item_dict.get("allow_comments", True)
            return permissions

        # Owner has full permissions
        if item_dict.get("owner_id") == current_user_id:
            permissions.update(
                {
                    "can_update": True,
                    "can_delete": True,
                    "can_comment": item_dict.get("allow_comments", True),
                }
            )
            return permissions

        # Check explicit permissions
        permission_query = select(item_permissions).where(
            and_(
                item_permissions.c.item_id == item_id,
                item_permissions.c.user_id == current_user_id,
                or_(
                    item_permissions.c.expires_at.is_(None),
                    item_permissions.c.expires_at > datetime.now(timezone.utc),
                ),
            )
        )

        permission = await db.fetch_one(permission_query)
        if permission:
            permissions.update(
                {
                    "can_update": permission["can_update"],
                    "can_delete": permission["can_delete"],
                    "can_comment": permission["can_comment"]
                    and item_dict.get("allow_comments", True),
                }
            )
        else:
            # Default permissions for non-owners
            permissions["can_comment"] = item_dict.get(
                "is_public", False
            ) and item_dict.get("allow_comments", True)

        return permissions
