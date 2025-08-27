from databases import Database
from sqlalchemy import MetaData
from app.constants import SQLALCHEMY_DATABASE_URI

metadata = MetaData()
database = Database(SQLALCHEMY_DATABASE_URI)

async def get_db():
    yield database
