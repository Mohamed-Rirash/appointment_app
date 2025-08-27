import pytest
import databases
import sqlalchemy
from datetime import datetime
from app.database import metadata, database
from app.constants import SQLALCHEMY_DATABASE_URI
from sqlalchemy import create_engine
from app.auth.security import hash_password
from app.auth.models import users  # SQLAlchemy Core Table object for users

# Setup database connection (sync or async)
engine = create_engine(SQLALCHEMY_DATABASE_URI.replace("+aiosqlite", ""))

@pytest.fixture(scope="function", autouse=True)
async def setup_db():
    # Create tables before test
    metadata.create_all(engine)
    await database.connect()
    yield
    await database.disconnect()
    metadata.drop_all(engine)

@pytest.fixture(scope="function")
async def test_session():
    # You can return `database` instance or connection if needed
    yield database

async def create_user(database, is_active=True, verified_at=None):
    query = users.insert().values(
        first_name="Keshari",
        last_name="Nandan",
        email="keshari@describly.com",
        password=hash_password("123#Describly"),
        updated_at=datetime.now(datetime.timezone.utc),
        is_active=is_active,
        verified_at=verified_at,
    )
    user_id = await database.execute(query)
    return user_id

@pytest.fixture(scope="function")
async def user(test_session):
    user_id = await create_user(test_session, is_active=True, verified_at=datetime.now(timezone.utc))
    query = user_table.select().where(user_table.c.id == user_id)
    user_record = await test_session.fetch_one(query)
    return user_record

@pytest.fixture(scope="function")
async def inactive_user(test_session):
    user_id = await create_user(test_session, is_active=False)
    query = user_table.select().where(user_table.c.id == user_id)
    user_record = await test_session.fetch_one(query)
    return user_record

@pytest.fixture(scope="function")
async def unverified_user(test_session):
    user_id = await create_user(test_session, is_active=True, verified_at=None)
    query = user_table.select().where(user_table.c.id == user_id)
    user_record = await test_session.fetch_one(query)
    return user_record
