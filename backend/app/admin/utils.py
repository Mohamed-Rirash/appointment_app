"""
Admin module utilities and helper functions
"""
import csv
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Union
from io import StringIO, BytesIO
from uuid import UUID

import xlsxwriter
from databases import Database

from app.admin.schemas import ExportFormat, AdminActionType
from app.admin.config import get_admin_config


class DataExporter:
    """Utility class for exporting data in various formats"""
    
    @staticmethod
    def export_to_csv(data: List[Dict[str, Any]], filename: str = None) -> str:
        """Export data to CSV format"""
        
        if not data:
            return ""
        
        output = StringIO()
        
        # Get field names from first record
        fieldnames = list(data[0].keys())
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in data:
            # Convert complex types to strings
            processed_row = {}
            for key, value in row.items():
                if isinstance(value, (dict, list)):
                    processed_row[key] = json.dumps(value)
                elif isinstance(value, datetime):
                    processed_row[key] = value.isoformat()
                elif isinstance(value, UUID):
                    processed_row[key] = str(value)
                else:
                    processed_row[key] = value
            
            writer.writerow(processed_row)
        
        return output.getvalue()
    
    @staticmethod
    def export_to_json(data: List[Dict[str, Any]], filename: str = None) -> str:
        """Export data to JSON format"""
        
        # Convert complex types for JSON serialization
        processed_data = []
        for row in data:
            processed_row = {}
            for key, value in row.items():
                if isinstance(value, datetime):
                    processed_row[key] = value.isoformat()
                elif isinstance(value, UUID):
                    processed_row[key] = str(value)
                else:
                    processed_row[key] = value
            processed_data.append(processed_row)
        
        return json.dumps(processed_data, indent=2, default=str)
    
    @staticmethod
    def export_to_xlsx(data: List[Dict[str, Any]], filename: str = None) -> bytes:
        """Export data to Excel format"""
        
        if not data:
            return b""
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet()
        
        # Get field names from first record
        fieldnames = list(data[0].keys())
        
        # Write headers
        for col, header in enumerate(fieldnames):
            worksheet.write(0, col, header)
        
        # Write data
        for row_idx, row in enumerate(data, start=1):
            for col_idx, field in enumerate(fieldnames):
                value = row.get(field, "")
                
                # Convert complex types
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                elif isinstance(value, datetime):
                    value = value.isoformat()
                elif isinstance(value, UUID):
                    value = str(value)
                
                worksheet.write(row_idx, col_idx, value)
        
        workbook.close()
        output.seek(0)
        return output.read()


class AdminPermissionChecker:
    """Utility class for checking admin permissions"""
    
    @staticmethod
    def can_perform_action(
        admin_roles: List[str],
        admin_permissions: List[str],
        required_permission: str,
        target_user_roles: Optional[List[str]] = None
    ) -> bool:
        """Check if admin can perform action on target user"""
        
        # System admins can do anything
        if "system_admin" in admin_roles or "*" in admin_permissions:
            return True
        
        # Check specific permission
        if required_permission in admin_permissions:
            # Additional checks for role-based restrictions
            if target_user_roles:
                # Super admins can manage regular users and admins
                if "super_admin" in admin_roles:
                    return "system_admin" not in target_user_roles
                
                # Regular admins can only manage regular users
                if "admin" in admin_roles:
                    return not any(role in ["admin", "super_admin", "system_admin"] for role in target_user_roles)
            
            return True
        
        return False
    
    @staticmethod
    def get_accessible_users_filter(admin_roles: List[str]) -> Dict[str, Any]:
        """Get filter conditions for users accessible to admin"""
        
        # System admins can access all users
        if "system_admin" in admin_roles:
            return {}
        
        # Super admins can access non-system users
        if "super_admin" in admin_roles:
            return {"is_system_user": False}
        
        # Regular admins can access regular users only
        if "admin" in admin_roles:
            return {
                "is_system_user": False,
                # Additional filters could be added here
            }
        
        # No access by default
        return {"id": None}  # This will return no results


class BulkOperationProcessor:
    """Utility class for processing bulk operations"""
    
    @staticmethod
    async def process_bulk_operation(
        operation_type: str,
        items: List[UUID],
        operation_func,
        batch_size: int = 100,
        max_errors: int = 10
    ) -> Dict[str, Any]:
        """Process bulk operation with batching and error handling"""
        
        total_items = len(items)
        successful_items = 0
        failed_items = 0
        errors = []
        
        # Process in batches
        for i in range(0, total_items, batch_size):
            batch = items[i:i + batch_size]
            
            for item_id in batch:
                try:
                    await operation_func(item_id)
                    successful_items += 1
                    
                except Exception as e:
                    failed_items += 1
                    errors.append({
                        "item_id": str(item_id),
                        "error": str(e),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    
                    # Stop if too many errors
                    if len(errors) >= max_errors:
                        break
            
            # Stop processing if too many errors
            if len(errors) >= max_errors:
                break
        
        return {
            "total_items": total_items,
            "successful_items": successful_items,
            "failed_items": failed_items,
            "errors": errors,
            "completion_rate": (successful_items / total_items) * 100 if total_items > 0 else 0
        }


class AdminAnalytics:
    """Utility class for admin analytics and reporting"""
    
    @staticmethod
    async def get_user_registration_trend(
        db: Database,
        days: int = 30
    ) -> List[Dict[str, Union[str, int]]]:
        """Get user registration trend over specified days"""
        
        from sqlalchemy import select, func, text
        from app.auth.models import users
        
        # Generate date range
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)
        
        query = select(
            func.date(users.c.created_at).label("date"),
            func.count().label("registrations")
        ).where(
            users.c.created_at >= start_date
        ).group_by(
            func.date(users.c.created_at)
        ).order_by("date")
        
        results = await db.fetch_all(query)
        
        return [
            {
                "date": result["date"].isoformat(),
                "registrations": result["registrations"]
            }
            for result in results
        ]
    
    @staticmethod
    async def get_role_distribution(db: Database) -> List[Dict[str, Union[str, int]]]:
        """Get distribution of users across roles"""
        
        from sqlalchemy import select, func
        from app.auth.models import roles, user_roles
        
        query = select(
            roles.c.name.label("role_name"),
            roles.c.display_name.label("role_display_name"),
            func.count(user_roles.c.user_id).label("user_count")
        ).select_from(
            roles.outerjoin(user_roles, roles.c.id == user_roles.c.role_id)
        ).group_by(
            roles.c.id, roles.c.name, roles.c.display_name
        ).order_by(
            func.count(user_roles.c.user_id).desc()
        )
        
        results = await db.fetch_all(query)
        
        return [
            {
                "role_name": result["role_name"],
                "role_display_name": result["role_display_name"],
                "user_count": result["user_count"]
            }
            for result in results
        ]
    
    @staticmethod
    def calculate_system_health_score(metrics: Dict[str, Any]) -> float:
        """Calculate overall system health score"""
        
        score = 100.0
        
        # Database health (20% weight)
        if metrics.get("database", {}).get("status") != "connected":
            score -= 20
        
        # Redis health (10% weight)
        redis_status = metrics.get("redis", {}).get("status")
        if redis_status and redis_status != "connected":
            score -= 10
        
        # Disk usage (20% weight)
        disk_usage = metrics.get("disk_usage", {}).get("used_percent", 0)
        if disk_usage > 90:
            score -= 20
        elif disk_usage > 80:
            score -= 10
        
        # Memory usage (20% weight)
        memory_usage = metrics.get("memory_usage", {}).get("used_percent", 0)
        if memory_usage > 90:
            score -= 20
        elif memory_usage > 80:
            score -= 10
        
        # CPU usage (15% weight)
        cpu_usage = metrics.get("cpu_usage", 0)
        if cpu_usage > 90:
            score -= 15
        elif cpu_usage > 80:
            score -= 7.5
        
        # Error rate (15% weight)
        error_rate = metrics.get("error_rate", 0)
        if error_rate > 0.05:  # 5%
            score -= 15
        elif error_rate > 0.01:  # 1%
            score -= 7.5
        
        return max(0, score)


class AdminNotificationManager:
    """Utility class for managing admin notifications"""
    
    @staticmethod
    async def create_system_alert(
        db: Database,
        alert_type: str,
        severity: str,
        title: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """Create system alert"""
        
        from sqlalchemy import insert
        from app.admin.models import system_alerts
        
        alert_id = uuid.uuid4()
        
        query = insert(system_alerts).values(
            id=alert_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            source="system",
            metadata=metadata or {},
            first_occurred=datetime.now(datetime.timezone.utc),
            last_occurred=datetime.now(datetime.timezone.utc)
        )
        
        await db.execute(query)
        return alert_id
    
    @staticmethod
    async def notify_admins(
        db: Database,
        title: str,
        message: str,
        notification_type: str = "info",
        priority: str = "normal",
        action_url: Optional[str] = None,
        action_label: Optional[str] = None
    ) -> List[UUID]:
        """Send notification to all admins"""
        
        from sqlalchemy import insert, select
        from app.admin.models import admin_notifications
        from app.auth.models import users
        from app.auth.models import user_roles, roles
        
        # Get all admin users
        admin_query = select(users.c.id).select_from(
            users
            .join(user_roles, users.c.id == user_roles.c.user_id)
            .join(roles, user_roles.c.role_id == roles.c.id)
        ).where(
            roles.c.name.in_(["admin", "super_admin", "system_admin"])
        ).distinct()
        
        admin_ids = await db.fetch_all(admin_query)
        
        notification_ids = []
        
        for admin_id_row in admin_ids:
            notification_id = uuid.uuid4()
            
            query = insert(admin_notifications).values(
                id=notification_id,
                admin_id=admin_id_row["id"],
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url,
                action_label=action_label,
                created_at=datetime.now(timezone.utc)
            )
            
            await db.execute(query)
            notification_ids.append(notification_id)
        
        return notification_ids


def mask_sensitive_data(data: Dict[str, Any], sensitive_fields: List[str] = None) -> Dict[str, Any]:
    """Mask sensitive fields in data for logging"""
    
    if sensitive_fields is None:
        sensitive_fields = [
            "password", "password_hash", "secret_key", "api_key", 
            "token", "refresh_token", "access_token"
        ]
    
    masked_data = data.copy()
    
    for field in sensitive_fields:
        if field in masked_data:
            if isinstance(masked_data[field], str) and len(masked_data[field]) > 4:
                masked_data[field] = masked_data[field][:2] + "*" * (len(masked_data[field]) - 4) + masked_data[field][-2:]
            else:
                masked_data[field] = "***"
    
    return masked_data


def generate_admin_report_filename(
    report_type: str,
    format_type: ExportFormat,
    timestamp: Optional[datetime] = None
) -> str:
    """Generate standardized filename for admin reports"""
    
    if timestamp is None:
        timestamp = datetime.now(datetime.timezone.utc)
    
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    
    return f"admin_{report_type}_{timestamp_str}.{format_type.value}"
