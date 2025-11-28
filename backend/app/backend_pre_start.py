import asyncio
import logging

from tenacity import (
    after_log,
    before_log,
    retry,
    stop_after_attempt,
    wait_fixed,
)

from app.database import database  # async Database instance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_TRIES = 60 * 5  # 5 minutes
WAIT_SECONDS = 1


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def init() -> None:
    logger.info("Trying to connect to the database...")
    await database.connect()
    logger.info("Database connection established successfully ✅")


async def main() -> None:
    logger.info("Initializing service (checking database connection)...")

    try:
        await init()
    finally:
        # Ensure connection is closed after successful test
        if database.is_connected:
            await database.disconnect()

    logger.info("Database is ready, service finished initializing 🚀")


if __name__ == "__main__":
    asyncio.run(main())
