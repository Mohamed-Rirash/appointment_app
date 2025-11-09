# event.py
import asyncio
import json
from collections.abc import AsyncIterator
from uuid import UUID

from pydantic import BaseModel


class EventModel(BaseModel):
    event: str
    data: str


class SSEBroker:
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
        while not q.empty():
            try:
                q.get_nowait()
            except Exception:
                break

    async def publish(self, event: str, data: dict) -> None:
        payload = json.dumps({"event": event, "data": data}, default=str)
        async with self._lock:
            targets = list(self._subscribers)
        for q in targets:
            try:
                await q.put(payload)
            except asyncio.QueueFull:
                pass

    async def event_generator(self, q: asyncio.Queue) -> AsyncIterator[str]:
        try:
            while True:
                payload = await q.get()
                yield f"data: {payload}\n\n"
        except asyncio.CancelledError:
            raise


# global dictionary of brokers per office
office_brokers: dict[UUID, SSEBroker] = {}
