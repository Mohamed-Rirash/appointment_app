import asyncio
import json
from collections.abc import AsyncIterator


class SSEBroker:
    """
    Simple in-memory SSE broker using asyncio.Queue per subscriber.
    Not for multi-process use; good for dev and single-process deployments.
    """

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.append(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue) -> None:
        async with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)
        # Drain queue
        try:
            while not q.empty():
                q.get_nowait()
        except Exception:
            pass

    async def publish(self, event: str, data: dict) -> None:
        payload = json.dumps({"event": event, "data": data}, default=str)
        async with self._lock:
            targets = list(self._subscribers)
        for q in targets:
            try:
                await q.put(payload)
            except asyncio.QueueFull:
                # Drop if subscriber is too slow
                pass

    async def event_generator(self, q: asyncio.Queue) -> AsyncIterator[str]:
        try:
            while True:
                payload = await q.get()
                yield "event: message\n"
                # Split by lines to comply with SSE format
                for line in payload.splitlines():
                    yield f"data: {line}\n"
                yield "\n"
        except asyncio.CancelledError:
            # client disconnected
            raise


# Global singleton broker for appointments events
appointments_broker = SSEBroker()
