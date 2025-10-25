"""
Test configuration and fixtures for the appointment application.

This module provides pytest fixtures for testing with:
- Async database connections using databases library
- FastAPI TestClient for synchronous tests
- HTTPX AsyncClient for async tests
- Authentication helpers
"""

import os
from collections.abc import AsyncGenerator, Generator
from pathlib import Path
from typing import Any

import pytest
import pytest_asyncio
from databases import Database
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Load test environment variables
test_env_path = Path(__file__).parent.parent / ".env.test"
if test_env_path.exists():
    load_dotenv(test_env_path, override=True)
else:
    # Fallback to .env if .env.test doesn't exist
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

from app.config import get_settings
from app.database import database
from app.main import app

settings = get_settings()


# ================================
# Database Fixtures
# ================================


@pytest_asyncio.fixture(scope="session")
async def test_db() -> AsyncGenerator[Database, None]:
    """
    Async database fixture for the entire test session.
    Connects to the database at the start and disconnects at the end.
    """
    await database.connect()
    yield database
    await database.disconnect()


@pytest_asyncio.fixture(scope="function")
async def db_transaction(test_db: Database) -> AsyncGenerator[Database, None]:
    """
    Database fixture with transaction rollback for each test.
    Each test runs in a transaction that is rolled back after the test.
    """
    async with test_db.transaction(force_rollback=True):
        yield test_db


# ================================
# Client Fixtures
# ================================


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    """
    Synchronous test client for FastAPI.
    Use this for synchronous tests.
    """
    with TestClient(app) as c:
        yield c


@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Async test client for FastAPI.
    Use this for async tests.
    """
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ================================
# Authentication Fixtures
# ================================


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    """
    Get authentication headers for superuser.
    Uses the FIRST_SUPERUSER credentials from settings.
    """
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }

    response = client.post("/api/v1/users/login", data=login_data)

    if response.status_code != 200:
        raise Exception(f"Failed to login as superuser: {response.text}")

    tokens = response.json()
    access_token = tokens["access_token"]

    return {"Authorization": f"Bearer {access_token}"}


@pytest_asyncio.fixture(scope="function")
async def async_superuser_token_headers(async_client: AsyncClient) -> dict[str, str]:
    """
    Get authentication headers for superuser (async version).
    """
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }

    response = await async_client.post("/api/v1/users/login", data=login_data)

    if response.status_code != 200:
        raise Exception(f"Failed to login as superuser: {response.text}")

    tokens = response.json()
    access_token = tokens["access_token"]

    return {"Authorization": f"Bearer {access_token}"}


# ================================
# Test Data Fixtures
# ================================


@pytest.fixture
def sample_citizen_data() -> dict[str, Any]:
    """Sample citizen data for testing"""
    return {
        "firstname": "John",
        "lastname": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
    }


@pytest.fixture
def sample_appointment_data() -> dict[str, Any]:
    """Sample appointment data for testing (without IDs)"""
    return {
        "purpose": "General consultation",
        "appointment_date": "2025-10-25T10:00:00Z",
        "time_slotted": "10:00:00",
    }


# ================================
# Pytest Configuration
# ================================


def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
