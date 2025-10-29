import asyncio
from datetime import datetime, time
from uuid import UUID
from databases import Database
from app.appointments.services import AppointmentService
from app.appointments.schemas import AppointmentDecision
from app.config import get_settings

settings = get_settings()

async def test_postpone():
    # Connect to database
    database = Database(settings.DATABASE_URL)
    await database.connect()
    
    try:
        # Test appointment ID (the one we approved earlier)
        appointment_id = UUID("9677b9d0-4909-4040-af1d-b4bbaed3b14b")
        user_id = UUID("a813cb76-1b7c-4820-a284-d8877f673b95")
        
        # Create decision with new date/time
        decision = AppointmentDecision(
            status="postponed",
            reason="Rescheduling for better time",
            new_appointment_date=datetime(2025, 11, 3, 6, 0, 30, 23000),
            new_time_slot=time(6, 0, 30, 23000)
        )
        
        print(f"Testing postpone for appointment {appointment_id}")
        print(f"New date: {decision.new_appointment_date}")
        print(f"New time: {decision.new_time_slot}")
        
        # Call the service
        result = await AppointmentService.postpone_appointment(
            database, appointment_id, decision, user_id
        )
        
        print(f"✅ Postpone successful!")
        print(f"Updated appointment status: {result.status}")
        print(f"New appointment date: {result.appointment_date}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(test_postpone())

