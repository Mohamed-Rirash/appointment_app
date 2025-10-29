#!/usr/bin/env python3
import asyncio
import os
from databases import Database

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/appointment_app")

async def check_appointment():
    db = Database(DATABASE_URL)
    await db.connect()
    
    appointment_id = "4095430c-ac92-49e8-95e3-218266f73ee7"
    
    # Query the appointments table directly
    query = "SELECT id, status, decided_at, decided_by, decision_reason FROM appointments WHERE id = :id"
    result = await db.fetch_one(query, values={"id": appointment_id})
    
    if result:
        print(f"Appointment found:")
        print(f"  ID: {result['id']}")
        print(f"  Status: {result['status']!r}")
        print(f"  Decided At: {result['decided_at']}")
        print(f"  Decided By: {result['decided_by']}")
        print(f"  Decision Reason: {result['decision_reason']}")
    else:
        print(f"Appointment not found")
    
    await db.disconnect()

asyncio.run(check_appointment())

