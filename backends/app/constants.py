# Constants for authentication
from app.config import get_settings

settings = get_settings()
SQLALCHEMY_DATABASE_URI = str(settings.SQLALCHEMY_DATABASE_URI)
