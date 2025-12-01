"""Database engine and initialization utilities for SQLModel."""

import logging

from sqlmodel import Session, create_engine, select

from app import crud
from app.config import get_settings
from app.models import User, UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def get_sync_database_uri() -> str:
    """Convert async database URI to sync (postgresql+asyncpg -> postgresql+psycopg2)."""
    uri = str(settings.SQLALCHEMY_DATABASE_URI)
    if "postgresql+asyncpg" in uri:
        return uri.replace("postgresql+asyncpg", "postgresql+psycopg2")
    return uri


# Create sync engine for SQLModel operations
engine = create_engine(get_sync_database_uri())


def init_db(session: Session) -> None:
    """Initialize database with first superuser if configured."""
    # Check if first superuser is configured
    if not settings.FIRST_SUPERUSER:
        logger.info("No FIRST_SUPERUSER configured, skipping superuser creation")
        return

    # Check if superuser already exists
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()

    if not user:
        logger.info(f"Creating first superuser: {settings.FIRST_SUPERUSER}")
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
        logger.info(f"First superuser created: {user.email}")
    else:
        logger.info(f"First superuser already exists: {user.email}")

