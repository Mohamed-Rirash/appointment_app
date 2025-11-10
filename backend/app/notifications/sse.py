# backend/app/notifications/sse.py
import asyncio
import json
import logging
from collections.abc import AsyncIterator
from datetime import datetime
from uuid import UUID

logger = logging.getLogger(__name__)

class SSEBroker:
    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to events with a bounded queue."""
        q = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.append(q)
        logger.info(f"Client subscribed. Total subscribers: {len(self._subscribers)}")
        return q

    async def unsubscribe(self, q: asyncio.Queue) -> None:
        """Unsubscribe and cleanup queue."""
        async with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)
                logger.info(f"Client unsubscribed. Total subscribers: {len(self._subscribers)}")
        
        # Drain queue safely
        while True:
            try:
                q.get_nowait()
            except asyncio.QueueEmpty:
                break
            except Exception:
                break

    async def publish(self, event: str, data: dict) -> None:
        """Publish event to all subscribers."""
        payload = json.dumps({"event": event, "data": data}, default=str)
        async with self._lock:
            targets = list(self._subscribers)
        
        for q in targets:
            try:
                await q.put(payload)
            except asyncio.QueueFull:
                logger.warning("Subscriber queue full, dropping event")
            except Exception as e:
                logger.error(f"Failed to publish to subscriber: {e}")

    async def event_generator(self, q: asyncio.Queue, request) -> AsyncIterator[str]:
        """
        Generate SSE events with heartbeat to keep connection alive.
        """
        try:
            # Initial connection
            yield f"data: {json.dumps({'event': 'connected', 'data': {'status': 'ok'}})}\n\n"
            
            while True:
                # Wait for event with 30s timeout
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat
                    heartbeat = json.dumps({
                        "event": "heartbeat",
                        "data": {"timestamp": datetime.utcnow().isoformat()}
                    })
                    yield f"data: {heartbeat}\n\n"
                
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info("Client disconnected detected")
                    break
                    
        except asyncio.CancelledError:
            logger.info("Event generator cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in event generator: {e}")
        finally:
            await self.unsubscribe(q)

# Global dictionary of brokers per office
office_brokers: dict[UUID, SSEBroker] = {}