import asyncio
import json
from enum import Enum

# office_id -> list of queues
office_connections: dict[str, list[asyncio.Queue]] = {}


async def broadcast_event(office_id: str, event: dict):
    data = f"data: {json.dumps(event)}\n\n"
    if office_id in office_connections:
        for queue in office_connections[office_id]:
            await queue.put(data)
