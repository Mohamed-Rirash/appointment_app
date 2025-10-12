import asyncio
import logging

from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.database import database  # your async Database instance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 5  # try for 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def init() -> None:
    try:
        logger.info("Trying to connect to the database...")
        await database.connect()
        logger.info("Database connection established successfully ✅")
        await database.disconnect()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise e


async def main() -> None:
    logger.info("Initializing service (checking database connection)...")
    await init()
    logger.info("Database is ready, service finished initializing 🚀")


if __name__ == "__main__":
    asyncio.run(main())
