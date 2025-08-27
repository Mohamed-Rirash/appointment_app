"""
Test configuration settings
"""
import os
from app.config import get_settings


def get_test_settings():
    """Get test settings with environment variables set for testing"""
    # Set test environment variables if not already set
    test_env_vars = {
        "ENVIRONMENT": "local",
        "PROJECT_NAME": "FastAPI Test",
        "SECRET_KEY": "test-secret-key-for-testing-only-not-secure",
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "test",
        "POSTGRES_PASSWORD": "test",
        "POSTGRES_DB": "test",
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_DB": "15",
        "MAIL_SERVER": "localhost",
        "MAIL_PORT": "1025",
        "MAIL_USERNAME": "test",
        "MAIL_PASSWORD": "test",
        "EMAILS_FROM_EMAIL": "test@example.com",
        "RATE_LIMIT_ENABLED": "false",
        "DEBUG": "true",
        "SUPPRESS_SEND": "true",
    }

    # Set environment variables for testing
    for key, value in test_env_vars.items():
        if key not in os.environ:
            os.environ[key] = value

    # Return the regular settings which will now use the test environment variables
    return get_settings()
