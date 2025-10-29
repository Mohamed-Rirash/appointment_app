import asyncio
import json

# office_id -> list of queues
office_connections: dict[str, list[asyncio.Queue]] = {}


async def broadcast_event(office_id: str, event: dict):
    """
    Broadcast an event to all connected clients for a specific office.

    Args:
        office_id: The office ID to broadcast to
        event: The event data to broadcast
    """
    try:
        data = f"data: {json.dumps(event)}\n\n"

        # Log broadcast attempt
        print(f"🔔 Broadcasting event to office {office_id}")
        print(f"   Event type: {event.get('type', 'unknown')}")
        print(f"   Active connections: {len(office_connections.get(office_id, []))}")

        if office_id in office_connections:
            connection_count = len(office_connections[office_id])
            if connection_count > 0:
                print(f"   ✅ Sending to {connection_count} connected client(s)")
                for queue in office_connections[office_id]:
                    try:
                        await queue.put(data)
                    except Exception as e:
                        print(f"   ❌ Failed to send to queue: {e!s}")
            else:
                print(f"   ⚠️  No active connections for office {office_id}")
        else:
            print(f"   ⚠️  Office {office_id} not in connections dict")
            print(f"   Available offices: {list(office_connections.keys())}")
    except Exception as e:
        print(f"❌ Error broadcasting event: {e!s}")
        import traceback
        traceback.print_exc()
