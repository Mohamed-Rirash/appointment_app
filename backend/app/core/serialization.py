import uuid
from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum
from typing import Any


def convert_to_json_serializable(obj: Any) -> Any:
    """
    Convert Python objects to JSON-serializable formats.

    Handles:
    - UUID objects -> strings
    - datetime/date/time objects -> ISO format strings
    - Decimal objects -> floats
    - Enum objects -> values
    - Dictionaries -> recursively convert values
    - Lists/tuples -> recursively convert items
    - Sets -> convert to lists

    Args:
        obj: The object to convert

    Returns:
        JSON-serializable version of the object
    """
    # Handle None
    if obj is None:
        return None

    # Handle UUID
    if isinstance(obj, uuid.UUID):
        return str(obj)

    # Handle datetime objects
    if isinstance(obj, datetime):
        return obj.isoformat()

    if isinstance(obj, date):
        return obj.isoformat()

    if isinstance(obj, time):
        return obj.isoformat()

    # Handle Decimal
    if isinstance(obj, Decimal):
        return float(obj)

    # Handle Enum
    if isinstance(obj, Enum):
        return obj.value

    # Handle dictionaries
    if isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}

    # Handle lists and tuples
    if isinstance(obj, (list, tuple)):
        return [convert_to_json_serializable(item) for item in obj]

    # Handle sets
    if isinstance(obj, set):
        return [convert_to_json_serializable(item) for item in obj]

    # Return as-is for primitive types (str, int, float, bool)
    return obj


def serialize_database_record(record: Any) -> dict[str, Any]:
    """
    Serialize a database record (from databases library) to a JSON-serializable dictionary.

    Args:
        record: Database record (mapping-like object)

    Returns:
        JSON-serializable dictionary
    """
    if record is None:
        return {}

    # Convert record to dict and then make it JSON-serializable
    record_dict = dict(record)
    return convert_to_json_serializable(record_dict)


def serialize_pydantic_model(model: Any) -> dict[str, Any]:
    """
    Serialize a Pydantic model to a JSON-serializable dictionary.

    Args:
        model: Pydantic model instance

    Returns:
        JSON-serializable dictionary
    """
    if model is None:
        return {}

    # Use Pydantic's model_dump and then ensure JSON serialization
    model_dict = model.model_dump()
    return convert_to_json_serializable(model_dict)
