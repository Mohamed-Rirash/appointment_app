# Backend API Documentation

A production-ready FastAPI backend for the Appointment Booking Application, featuring comprehensive authentication, role-based access control, and appointment management.

## 📋 Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Overview

The backend provides a RESTful API built with FastAPI, featuring:

- **JWT Authentication** with secure token refresh and CSRF protection
- **Role-Based Access Control (RBAC)** with granular permissions
- **Appointment Management** with office and host scheduling
- **User Management** with email verification and password recovery
- **Comprehensive Logging** with structured JSON output
- **Rate Limiting** on sensitive endpoints
- **Database Migrations** with Alembic
- **Automated Testing** with Pytest

## Requirements

### System Requirements
- **Python 3.11+**
- **PostgreSQL 12+**
- **Redis 6+** (for caching and sessions)
- **Docker & Docker Compose** (recommended)

### Development Tools
- **[uv](https://docs.astral.sh/uv/)** - Python package manager (recommended)
- **[Git](https://git-scm.com/)** - Version control
- **[VS Code](https://code.visualstudio.com/)** - Recommended IDE

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Access API documentation
# http://localhost/docs
```

### Local Development Setup

1. **Install dependencies**
   ```bash
   cd backend
   uv sync
   ```

2. **Activate virtual environment**
   ```bash
   source .venv/bin/activate
   ```

3. **Configure environment**
   ```bash
   # Copy example .env
   cp ../.env.example ../.env

   # Update database connection and other settings
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start development server**
   ```bash
   fastapi run --reload app/main.py
   ```

   The API will be available at `http://localhost:8000`

## Project Structure

```
backend/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── routes/
│   │   │   ├── users.py       # User endpoints
│   │   │   ├── offices.py     # Office endpoints
│   │   │   ├── appointments.py # Appointment endpoints
│   │   │   └── admin.py       # Admin endpoints
│   │   └── dependencies.py    # Shared dependencies
│   │
│   ├── auth/                   # Authentication & Authorization
│   │   ├── router.py          # Auth endpoints
│   │   ├── service.py         # Auth business logic
│   │   ├── dependencies.py    # Auth dependencies
│   │   ├── crud.py            # User CRUD operations
│   │   ├── rbac.py            # Role-based access control
│   │   └── config.py          # Auth configuration
│   │
│   ├── core/                   # Core utilities
│   │   ├── security.py        # JWT and password utilities
│   │   ├── middleware/        # Custom middleware
│   │   ├── exceptions.py      # Custom exceptions
│   │   └── db.py              # Database configuration
│   │
│   ├── models.py              # SQLModel definitions
│   ├── crud.py                # Database operations
│   ├── config.py              # Application settings
│   ├── database.py            # Database connection
│   ├── loggs.py               # Logging configuration
│   └── main.py                # Application entry point
│
├── tests/                      # Test suite
│   ├── conftest.py            # Pytest configuration
│   ├── test_auth.py           # Authentication tests
│   ├── test_users.py          # User endpoint tests
│   └── test_appointments.py   # Appointment tests
│
├── alembic/                    # Database migrations
│   ├── versions/              # Migration files
│   └── env.py                 # Migration configuration
│
├── scripts/
│   ├── prestart.sh            # Pre-startup setup
│   ├── test.sh                # Run tests
│   └── tests-start.sh         # Run tests with stack
│
├── Dockerfile                 # Container image
├── pyproject.toml             # Python dependencies
├── uv.lock                    # Dependency lock file
└── README.md                  # This file
```

## Development

### Code Organization

**Models** (`app/models.py`)
- Define SQLModel classes for database tables
- Include Pydantic validators for data validation
- Use type hints for all fields

**API Routes** (`app/api/routes/`)
- Organize endpoints by resource (users, offices, appointments)
- Use dependency injection for authentication and validation
- Return appropriate HTTP status codes

**CRUD Operations** (`app/crud.py`)
- Implement database queries
- Use async/await for database operations
- Handle transactions for complex operations

**Authentication** (`app/auth/`)
- JWT token generation and validation
- Password hashing and verification
- Role-based access control

### Hot Reload Development

#### Using Docker Compose Watch

```bash
# Start services with hot reload
docker compose watch
```

This enables:
- Code synchronization to container
- Automatic server restart on changes
- Live debugging capabilities

#### Interactive Container Shell

```bash
# In one terminal, start the stack
docker compose watch

# In another terminal, access the container
docker compose exec backend bash

# Inside the container, run the development server
fastapi run --reload app/main.py
```

### VS Code Integration

The project includes VS Code configuration for:

1. **Debugging**
   - Set breakpoints in code
   - Step through execution
   - Inspect variables
   - View call stack

2. **Testing**
   - Run tests from Test Explorer
   - Debug individual tests
   - View coverage reports

**Setup**:
- Ensure Python interpreter is set to `backend/.venv/bin/python`
- Install Python extension for VS Code
- Open `.vscode/settings.json` to verify configuration

### Code Style & Linting

```bash
# Format code
ruff format app/

# Check linting
ruff check app/

# Type checking
mypy app/
```

### Environment Variables

Key backend environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | JWT signing key | Generated secret |
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://user:pass@host/db` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `ENVIRONMENT` | Deployment environment | `local`, `development`, `production` |
| `LOG_LEVEL` | Logging level | `DEBUG`, `INFO`, `WARNING` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` or `mailpit` |

See `.env` file for complete list.

## Testing

### Running Tests

#### Full Test Suite

```bash
# Run all tests
bash scripts/test.sh

# Or with Docker
docker compose exec backend bash scripts/test.sh
```

#### Specific Tests

```bash
# Run specific test file
pytest tests/test_auth.py

# Run specific test function
pytest tests/test_auth.py::test_login

# Run tests matching pattern
pytest -k "test_user"

# Stop on first failure
pytest -x

# Show print statements
pytest -s

# Verbose output
pytest -v
```

#### With Running Stack

```bash
# Run tests against running services
docker compose exec backend bash scripts/tests-start.sh

# With additional pytest arguments
docker compose exec backend bash scripts/tests-start.sh -v -x
```

### Test Coverage

```bash
# Generate coverage report
pytest --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Test Structure

```
tests/
├── conftest.py              # Pytest fixtures and configuration
├── test_auth.py             # Authentication tests
├── test_users.py            # User endpoint tests
├── test_appointments.py     # Appointment tests
└── test_admin.py            # Admin endpoint tests
```

### Writing Tests

Example test structure:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Fixture providing authenticated headers"""
    response = client.post("/api/v1/users/login", data={
        "username": "test@example.com",
        "password": "testpass123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_get_users(auth_headers):
    """Test getting users list"""
    response = client.get("/api/v1/admin/users", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

## Database

### Migrations with Alembic

Alembic manages database schema changes. Migrations are version-controlled and can be applied or rolled back.

#### Creating Migrations

1. **Modify a model** in `app/models.py`

2. **Create migration**
   ```bash
   # Inside container
   docker compose exec backend bash

   # Generate migration
   alembic revision --autogenerate -m "Add column to User"
   ```

3. **Review migration** in `alembic/versions/`

4. **Apply migration**
   ```bash
   alembic upgrade head
   ```

#### Common Migration Commands

```bash
# View current revision
alembic current

# View migration history
alembic history

# Upgrade to specific revision
alembic upgrade <revision>

# Downgrade one revision
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade <revision>

# Show SQL without executing
alembic upgrade head --sql
```

#### Troubleshooting Migrations

```bash
# Mark migration as applied without running
alembic stamp <revision>

# Merge conflicting branches
alembic merge -m "Merge branches"

# Show current database state
alembic current
```

### Database Schema

#### Core Tables

**users**
- User accounts with authentication
- Email, password hash, verification status
- Role assignment and permissions

**offices**
- Office locations
- Scheduling configuration
- Host assignments

**appointments**
- Booking records
- Time slots and duration
- User and office references

**roles & permissions**
- RBAC configuration
- Permission definitions
- Role assignments

**token_denylist**
- Revoked JWT tokens
- Logout tracking
- Token expiration

### Direct Database Access

```bash
# Connect to PostgreSQL
docker compose exec db psql -U postgres -d app

# Useful queries
\dt                    # List tables
\d users               # Describe table
SELECT * FROM users;   # Query data
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/login` | User login |
| POST | `/api/v1/users/refresh` | Refresh access token |
| POST | `/api/v1/users/logout` | User logout |
| POST | `/api/v1/users/request-password-reset` | Request password reset |
| POST | `/api/v1/users/reset-password` | Reset password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user |
| PUT | `/api/v1/users/me` | Update current user |
| POST | `/api/v1/users/change-password` | Change password |
| POST | `/api/v1/users/verify-email` | Verify email |

### Admin - Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users |
| POST | `/api/v1/admin/users` | Create user |
| GET | `/api/v1/admin/users/{user_id}` | Get user details |
| PUT | `/api/v1/admin/users/{user_id}` | Update user |
| DELETE | `/api/v1/admin/users/{user_id}` | Delete user |
| PATCH | `/api/v1/admin/users/{user_id}/activate` | Activate user |
| PATCH | `/api/v1/admin/users/{user_id}/deactivate` | Deactivate user |
| PATCH | `/api/v1/admin/users/{user_id}/suspend` | Suspend user |
| POST | `/api/v1/admin/users/{user_id}/resend-invite` | Resend invite |

### Offices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/offices` | List offices |
| POST | `/api/v1/offices` | Create office |
| GET | `/api/v1/offices/{office_id}` | Get office details |
| PATCH | `/api/v1/offices/{office_id}` | Update office |
| DELETE | `/api/v1/offices/{office_id}` | Delete office |
| POST | `/api/v1/offices/{office_id}/activate` | Activate office |
| POST | `/api/v1/offices/{office_id}/deactivate` | Deactivate office |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/appointments` | List appointments |
| POST | `/api/v1/appointments` | Create appointment |
| GET | `/api/v1/appointments/{appointment_id}` | Get appointment |
| PATCH | `/api/v1/appointments/{appointment_id}` | Update appointment |
| DELETE | `/api/v1/appointments/{appointment_id}` | Cancel appointment |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |
| GET | `/openapi.json` | OpenAPI schema |

## Email Templates

Email templates are located in `app/email-templates/`:

- `src/` - MJML source files (editable)
- `build/` - Compiled HTML templates (used by app)

### Creating Email Templates

1. **Install MJML Extension** for VS Code
   - Search for "MJML" in extensions
   - Install by Attila Buti

2. **Create template** in `src/` directory
   ```
   app/email-templates/src/welcome.mjml
   ```

3. **Export to HTML**
   - Open `.mjml` file
   - Press `Ctrl+Shift+P`
   - Search "MJML: Export to HTML"
   - Save to `build/` directory

4. **Use in code**
   ```python
   from app.core.email import send_email

   send_email(
       to=user.email,
       subject="Welcome",
       template_name="welcome",
       context={"user_name": user.first_name}
   )
   ```

## Troubleshooting

### Common Issues

**Database connection error**
```
Error: could not connect to server
```
- Ensure PostgreSQL is running: `docker compose ps db`
- Check DATABASE_URL in `.env`
- Verify credentials

**Migration conflicts**
```
FAILED: Can't locate revision identified by 'xxx'
```
- Check migration history: `alembic history`
- Resolve conflicts in migration files
- Use `alembic merge` if needed

**Port already in use**
```
Address already in use
```
- Find process: `lsof -i :8000`
- Kill process: `kill -9 <PID>`

**Import errors**
```
ModuleNotFoundError: No module named 'app'
```
- Ensure virtual environment is activated
- Run `uv sync` to install dependencies
- Check Python path in IDE

### Debug Mode

Enable debug logging:

```bash
# In .env
LOG_LEVEL=DEBUG

# Or via environment variable
export LOG_LEVEL=DEBUG
```

View logs:
```bash
docker compose logs -f backend
```

### Performance Issues

**Slow queries**
- Check database indexes
- Review query logs
- Use `EXPLAIN ANALYZE` in PostgreSQL

**High memory usage**
- Check for memory leaks
- Review async operations
- Monitor with `docker stats`

## Contributing

### Code Standards

- **Type hints** on all functions
- **Docstrings** for public functions
- **Tests** for new features
- **Migrations** for schema changes
- **Logging** for important operations

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Run full test suite
5. Submit PR with description

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com)
- [Pydantic Documentation](https://docs.pydantic.dev)
- [Alembic Documentation](https://alembic.sqlalchemy.org)
- [Pytest Documentation](https://docs.pytest.org)

## Support

For issues or questions:
- Check API documentation: http://localhost/docs
- Review logs: `docker compose logs backend`
- Check main README: [../README.md](../README.md)

---

**Last Updated**: October 2025
**Version**: 1.0.0
