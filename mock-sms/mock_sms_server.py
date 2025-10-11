#!/usr/bin/env python3
"""
Mock SMS Server - Simple SMS testing service similar to Mailpit but for SMS
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import List, Dict, Any

app = FastAPI(title="Mock SMS Server", description="SMS testing service for development")

# In-memory storage for SMS messages (in production, use a database)
sms_messages = []
message_id_counter = 1

class SMSMessage(BaseModel):
    to: str
    message: str
    from_: str

class SMSDelivery(BaseModel):
    id: int
    to: str
    message: str
    from_: str
    timestamp: str
    status: str = "delivered"

@app.post("/sms", response_model=SMSDelivery)
async def send_sms(sms: SMSMessage):
    """Send SMS message and store it for testing"""
    global message_id_counter

    delivery = SMSDelivery(
        id=message_id_counter,
        to=sms.to,
        message=sms.message,
        from_=sms.from_,
        timestamp=datetime.now().isoformat(),
        status="delivered"
    )

    sms_messages.append(delivery.dict())
    message_id_counter += 1

    print(f"SMS sent to {sms.to}: {sms.message}")
    return delivery

@app.get("/sms", response_model=List[Dict[str, Any]])
async def get_sms_messages(limit: int = 100, offset: int = 0):
    """Get all SMS messages with pagination"""
    return sms_messages[offset:offset + limit]

@app.get("/sms/{message_id}", response_model=Dict[str, Any])
async def get_sms_message(message_id: int):
    """Get a specific SMS message by ID"""
    for msg in sms_messages:
        if msg["id"] == message_id:
            return msg
    raise HTTPException(status_code=404, detail="SMS message not found")

@app.delete("/sms", response_model=Dict[str, str])
async def clear_sms_messages():
    """Clear all SMS messages (for testing)"""
    sms_messages.clear()
    return {"message": "All SMS messages cleared"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "mock-sms-server"}

@app.get("/", response_class=HTMLResponse)
async def get_web_ui():
    """Serve the web UI"""
    with open("index.html", "r") as f:
        return f.read()

# Mount static files for web UI
app.mount("/static", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3001))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
