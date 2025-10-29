"""
Global utility functions for common functionality
This module provides reusable utility functions that can be used across all modules
"""

import hashlib
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from databases import Database
from fastapi import HTTPException, status
from sqlalchemy import and_, func, select

# ================================
# String and Text Utils
# ================================


def slugify(text: str, max_length: int = 50) -> str:
    """Convert text to URL-friendly slug"""
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[-\s]+", "-", slug)
    slug = slug.strip("-")

    # Truncate if too long
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip("-")

    return slug


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to specified length with suffix"""
    if len(text) <= max_length:
        return text

    return text[: max_length - len(suffix)] + suffix


def extract_mentions(text: str) -> list[str]:
    """Extract @mentions from text"""
    mention_pattern = r"@(\w+)"
    return re.findall(mention_pattern, text)


def extract_hashtags(text: str) -> list[str]:
    """Extract #hashtags from text"""
    hashtag_pattern = r"#(\w+)"
    return re.findall(hashtag_pattern, text)


def clean_html(text: str) -> str:
    """Remove HTML tags from text"""
    html_pattern = re.compile(r"<[^>]+>")
    return html_pattern.sub("", text)


def mask_sensitive_data(data: str, visible_chars: int = 4, mask_char: str = "*") -> str:
    """Mask sensitive data showing only first/last characters"""
    if len(data) <= visible_chars * 2:
        return mask_char * len(data)

    visible_start = visible_chars
    visible_end = visible_chars
    masked_length = len(data) - visible_start - visible_end

    return data[:visible_start] + mask_char * masked_length + data[-visible_end:]


# ================================
# Validation Utils
# ================================


def validate_email(email: str) -> bool:
    """Validate email format"""
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(email_pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Simple international phone validation
    phone_pattern = r"^\+?[1-9]\d{1,14}$"
    cleaned_phone = re.sub(r"[\s\-\(\)]", "", phone)
    return re.match(phone_pattern, cleaned_phone) is not None


def validate_password_strength(password: str) -> dict[str, Any]:
    """Validate password strength and return detailed feedback"""
    result = {
        "is_valid": True,
        "score": 0,
        "feedback": [],
        "requirements_met": {
            "min_length": len(password) >= 8,
            "has_uppercase": bool(re.search(r"[A-Z]", password)),
            "has_lowercase": bool(re.search(r"[a-z]", password)),
            "has_digit": bool(re.search(r"\d", password)),
            "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
        },
    }

    # Calculate score
    score = sum(result["requirements_met"].values())
    result["score"] = score

    # Generate feedback
    if not result["requirements_met"]["min_length"]:
        result["feedback"].append("Password must be at least 8 characters long")
    if not result["requirements_met"]["has_uppercase"]:
        result["feedback"].append("Password must contain at least one uppercase letter")
    if not result["requirements_met"]["has_lowercase"]:
        result["feedback"].append("Password must contain at least one lowercase letter")
    if not result["requirements_met"]["has_digit"]:
        result["feedback"].append("Password must contain at least one digit")
    if not result["requirements_met"]["has_special"]:
        result["feedback"].append(
            "Password must contain at least one special character"
        )

    result["is_valid"] = score >= 4  # Require at least 4 out of 5 criteria

    return result


def validate_url(url: str) -> bool:
    """Validate URL format"""
    url_pattern = r"^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$"
    return re.match(url_pattern, url) is not None


# ================================
# Permission Utils
# ================================


def check_resource_permission(
    user: User,
    resource: dict[str, Any],
    required_permission: str,
    owner_field: str = "owner_id",
) -> bool:
    """Check if user has permission for a resource"""

    # Admin override
    if user.is_admin:
        return True

    # Owner check
    if resource.get(owner_field) == user.id:
        return True

    # Permission check
    if required_permission in user.permissions:
        return True

    # Check resource-specific permissions (if implemented)
    resource_permissions = resource.get("permissions", {})
    user_permissions = resource_permissions.get(str(user.id), [])

    return required_permission in user_permissions


def get_user_accessible_resources(
    user: User,
    all_resources: list[dict[str, Any]],
    owner_field: str = "owner_id",
    public_field: str = "is_public",
) -> list[dict[str, Any]]:
    """Filter resources based on user access permissions"""

    accessible_resources = []

    for resource in all_resources:
        # Admin can see all
        if user.is_admin:
            accessible_resources.append(resource)
            continue

        # Owner can see their own
        if resource.get(owner_field) == user.id:
            accessible_resources.append(resource)
            continue

        # Anyone can see public resources
        if resource.get(public_field, False):
            accessible_resources.append(resource)
            continue

    return accessible_resources


def calculate_permission_level(
    user: User, resource: dict[str, Any], owner_field: str = "owner_id"
) -> str:
    """Calculate user's permission level for a resource"""

    if user.is_admin:
        return "admin"

    if resource.get(owner_field) == user.id:
        return "owner"

    if resource.get("is_public", False):
        return "read"

    # Check explicit permissions
    resource_permissions = resource.get("permissions", {})
    user_permissions = resource_permissions.get(str(user.id), [])

    if "write" in user_permissions:
        return "write"
    elif "read" in user_permissions:
        return "read"

    return "none"


# ================================
# Data Processing Utils
# ================================


def paginate_results(
    appointments: list[Any], page: int, size: int
) -> tuple[list[Any], dict[str, Any]]:
    """Paginate a list of appointments and return metadata"""

    total = len(appointments)
    pages = (total + size - 1) // size
    start_idx = (page - 1) * size
    end_idx = start_idx + size

    paginated_appointments = appointments[start_idx:end_idx]

    metadata = {
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }

    return paginated_appointments, metadata


def group_by_field(
    appointments: list[dict[str, Any]], field: str
) -> dict[str, list[dict[str, Any]]]:
    """Group appointments by a specific field"""
    grouped = {}

    for item in appointments:
        key = item.get(field, "unknown")
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(item)

    return grouped


def sort_appointments(
    appointments: list[dict[str, Any]], sort_by: str, sort_order: str = "desc"
) -> list[dict[str, Any]]:
    """Sort appointments by a field"""

    reverse = sort_order.lower() == "desc"

    try:
        return sorted(appointments, key=lambda x: x.get(sort_by, ""), reverse=reverse)
    except (TypeError, KeyError):
        # If sorting fails, return original list
        return appointments


def filter_appointments(
    appointments: list[dict[str, Any]], filters: dict[str, Any]
) -> list[dict[str, Any]]:
    """Filter appointments based on criteria"""

    filtered_appointments = appointments

    for field, value in filters.appointments():
        if value is None:
            continue

        if isinstance(value, bool):
            filtered_appointments = [
                item for item in filtered_appointments if item.get(field) == value
            ]
        elif isinstance(value, str):
            filtered_appointments = [
                item
                for item in filtered_appointments
                if value.lower() in str(item.get(field, "")).lower()
            ]
        elif isinstance(value, (int, float)):
            filtered_appointments = [
                item for item in filtered_appointments if item.get(field) == value
            ]
        elif isinstance(value, list):
            filtered_appointments = [
                item for item in filtered_appointments if item.get(field) in value
            ]

    return filtered_appointments


# ================================
# File and Format Utils
# ================================


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""

    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0

    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f} {size_names[i]}"


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return filename.split(".")[-1].lower() if "." in filename else ""


def is_allowed_file_type(filename: str, allowed_extensions: list[str]) -> bool:
    """Check if file type is allowed"""
    extension = get_file_extension(filename)
    return extension in [ext.lower().lstrip(".") for ext in allowed_extensions]


def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """Generate unique filename with UUID"""
    extension = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())

    if prefix:
        return f"{prefix}_{unique_id}.{extension}"

    return f"{unique_id}.{extension}"


def calculate_file_checksum(file_content: bytes, algorithm: str = "sha256") -> str:
    """Calculate file checksum"""

    hash_obj = hashlib.new(algorithm)
    hash_obj.update(file_content)
    return hash_obj.hexdigest()


# ================================
# Date and Time Utils
# ================================


def format_datetime(dt: datetime, format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string"""
    return dt.strftime(format_string)


def parse_datetime(
    date_string: str, format_string: str = "%Y-%m-%d %H:%M:%S"
) -> datetime:
    """Parse string to datetime"""
    return datetime.strptime(date_string, format_string)


def get_time_ago(dt: datetime) -> str:
    """Get human readable time ago string"""

    now = datetime.now(UTC)
    diff = now - dt

    if diff.days > 365:
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"
    elif diff.days > 30:
        months = diff.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"


def is_business_hours(dt: datetime, start_hour: int = 9, end_hour: int = 17) -> bool:
    """Check if datetime is within business hours"""
    return start_hour <= dt.hour < end_hour and dt.weekday() < 5


def get_next_business_day(dt: datetime) -> datetime:
    """Get next business day"""
    next_day = dt + timedelta(days=1)

    # Skip weekends
    while next_day.weekday() >= 5:
        next_day += timedelta(days=1)

    return next_day


# ================================
# Security Utils
# ================================


def generate_secure_token(length: int = 32) -> str:
    """Generate secure random token"""
    import secrets

    return secrets.token_urlsafe(length)


def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP"""
    import secrets

    return "".join([str(secrets.randbelow(10)) for _ in range(length)])


def hash_data(data: str, salt: str = "") -> str:
    """Hash data with optional salt"""
    combined = data + salt
    return hashlib.sha256(combined.encode()).hexdigest()


def verify_hash(data: str, hashed: str, salt: str = "") -> bool:
    """Verify hashed data"""
    return hash_data(data, salt) == hashed


# ================================
# Database Utils
# ================================


async def check_record_exists(db: Database, table: Any, field: str, value: Any) -> bool:
    """Check if record exists in database"""

    query = (
        select(func.count()).select_from(table).where(getattr(table.c, field) == value)
    )

    count = await db.fetch_val(query)
    return count > 0


async def get_or_create_record(
    db: Database, table: Any, defaults: dict[str, Any], **lookup_fields
) -> tuple[dict[str, Any], bool]:
    """Get existing record or create new one"""

    # Try to get existing record
    conditions = [
        getattr(table.c, field) == value for field, value in lookup_fields.items()
    ]
    query = select(table).where(and_(*conditions))

    existing = await db.fetch_one(query)

    if existing:
        return dict(existing), False

    # Create new record
    create_data = {**lookup_fields, **defaults}
    insert_query = table.insert().values(**create_data)

    await db.execute(insert_query)

    # Get the created record
    new_record = await db.fetch_one(query)
    return dict(new_record), True


# ================================
# Error Handling Utils
# ================================


def create_error_response(
    message: str,
    error_code: str | None = None,
    details: dict[str, Any] | None = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> HTTPException:
    """Create standardized error response"""

    error_detail = {
        "message": message,
        "error_code": error_code,
        "details": details or {},
        "timestamp": datetime.now(UTC).isoformat(),
    }

    return HTTPException(status_code=status_code, detail=error_detail)


def handle_database_error(error: Exception) -> HTTPException:
    """Handle database errors and return appropriate HTTP exception"""

    error_message = str(error)

    if "unique constraint" in error_message.lower():
        return create_error_response(
            "Resource already exists",
            "DUPLICATE_RESOURCE",
            {"database_error": error_message},
            status.HTTP_409_CONFLICT,
        )
    elif "foreign key constraint" in error_message.lower():
        return create_error_response(
            "Referenced resource not found",
            "INVALID_REFERENCE",
            {"database_error": error_message},
            status.HTTP_400_BAD_REQUEST,
        )
    else:
        return create_error_response(
            "Database operation failed",
            "DATABASE_ERROR",
            {"database_error": error_message},
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
