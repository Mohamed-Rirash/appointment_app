# Backend Tests

Comprehensive test suite for the Appointment Management System backend.

## 📁 Test Structure

```
tests/
├── conftest.py              # Test fixtures and configuration
├── test_basic.py            # Basic health checks and setup tests
├── test_auth.py             # Authentication and authorization tests
├── test_admin.py            # User and role management tests
├── test_offices.py          # Office management and time slot tests
├── test_appointments.py     # Appointment CRUD and workflow tests
└── utils/                   # Test utilities
    ├── user.py              # User-related test helpers
    └── utils.py             # General test utilities
```

## 🚀 Running Tests

### Using Docker (Recommended)

```bash
# Run all tests
docker compose exec backend pytest

# Run with verbose output
docker compose exec backend pytest -v

# Run specific test file
docker compose exec backend pytest tests/test_auth.py -v

# Run specific test class
docker compose exec backend pytest tests/test_auth.py::TestAuthentication -v

# Run specific test
docker compose exec backend pytest tests/test_auth.py::TestAuthentication::test_login_success -v

# Run with coverage
docker compose exec backend pytest --cov=app --cov-report=html

# Run only integration tests
docker compose exec backend pytest -m integration

# Run only unit tests
docker compose exec backend pytest -m unit

# Skip slow tests
docker compose exec backend pytest -m "not slow"
```

### Using uv (Local Development)

```bash
cd backend

# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_auth.py -v

# Run with coverage
uv run pytest --cov=app --cov-report=html
```

## 🏷️ Test Markers

Tests are organized using pytest markers:

- **`@pytest.mark.integration`** - Tests that require database and external services
- **`@pytest.mark.unit`** - Pure unit tests without external dependencies
- **`@pytest.mark.slow`** - Tests that take longer to run
- **`@pytest.mark.asyncio`** - Async tests
- **`@pytest.mark.skip`** - Tests that are skipped (require additional setup)

### Running Tests by Marker

```bash
# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit

# Skip slow tests
pytest -m "not slow"

# Run integration tests but skip slow ones
pytest -m "integration and not slow"
```

## 🧪 Test Categories

### 1. Authentication Tests (`test_auth.py`)

Tests for user authentication and authorization:

- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Get current user profile
- ✅ Logout functionality
- ✅ Token validation
- ✅ Password reset flow
- ✅ Async authentication

**Example:**
```bash
docker compose exec backend pytest tests/test_auth.py -v
```

### 2. Admin/User Management Tests (`test_admin.py`)

Tests for user and role management:

- ✅ User CRUD operations
- ✅ User pagination and filtering
- ✅ User search
- ✅ Role management
- ✅ Permission management
- ✅ Role assignment
- ✅ Input validation

**Example:**
```bash
docker compose exec backend pytest tests/test_admin.py::TestUserManagement -v
```

### 3. Office Management Tests (`test_offices.py`)

Tests for office and time slot management:

- ✅ Office CRUD operations
- ✅ Office search
- ✅ Host search
- ✅ Time slot generation
- ✅ Available slots retrieval
- ✅ Host assignment
- ✅ Office availability
- ✅ Office statistics

**Example:**
```bash
docker compose exec backend pytest tests/test_offices.py -v
```

### 4. Appointment Tests (`test_appointments.py`)

Tests for appointment workflow:

- ✅ Create appointment with citizen
- ✅ Get all appointments
- ✅ Filter appointments
- ✅ Search appointments
- ✅ Appointment decisions (approve/deny)
- ✅ Cancel appointment
- ✅ Complete appointment
- ✅ Edit appointment
- ✅ Input validation

**Example:**
```bash
docker compose exec backend pytest tests/test_appointments.py -v
```

### 5. Basic Tests (`test_basic.py`)

Basic health checks and setup verification:

- ✅ App initialization
- ✅ Health endpoint
- ✅ API documentation
- ✅ Database connection
- ✅ Fixtures validation

**Example:**
```bash
docker compose exec backend pytest tests/test_basic.py -v
```

## 🔧 Test Fixtures

Available fixtures from `conftest.py`:

### Database Fixtures

```python
async def test_with_db(test_db: Database):
    """Use database connection for entire test session"""
    pass

async def test_with_transaction(db_transaction: Database):
    """Use database with automatic rollback after test"""
    pass
```

### Client Fixtures

```python
def test_sync_endpoint(client: TestClient):
    """Test with synchronous client"""
    response = client.get("/api/v1/endpoint")
    assert response.status_code == 200

async def test_async_endpoint(async_client: AsyncClient):
    """Test with asynchronous client"""
    response = await async_client.get("/api/v1/endpoint")
    assert response.status_code == 200
```

### Authentication Fixtures

```python
def test_authenticated(client: TestClient, superuser_token_headers: dict):
    """Test with authentication"""
    response = client.get(
        "/api/v1/users/me",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
```

### Test Data Fixtures

```python
def test_with_sample_data(sample_citizen_data: dict, sample_appointment_data: dict):
    """Test with pre-configured test data"""
    assert "firstname" in sample_citizen_data
    assert "purpose" in sample_appointment_data
```

## 📊 Coverage Reports

### Generate Coverage Report

```bash
# Generate HTML coverage report
docker compose exec backend pytest --cov=app --cov-report=html

# Generate terminal coverage report
docker compose exec backend pytest --cov=app --cov-report=term

# Generate both
docker compose exec backend pytest --cov=app --cov-report=html --cov-report=term
```

### View Coverage Report

```bash
# Open HTML report in browser
open backend/htmlcov/index.html
```

## 🎯 Writing New Tests

### Test Template

```python
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestMyFeature:
    """Test my feature"""

    def test_my_endpoint(self, client: TestClient, superuser_token_headers: dict):
        """Test my endpoint"""
        response = client.get(
            "/api/v1/my-endpoint",
            headers=superuser_token_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data


@pytest.mark.unit
class TestMyValidation:
    """Test my validation logic"""

    def test_invalid_input(self, client: TestClient):
        """Test with invalid input"""
        response = client.post(
            "/api/v1/my-endpoint",
            json={"invalid": "data"},
        )
        
        assert response.status_code == 422
```

## 🐛 Debugging Tests

### Run with Debug Output

```bash
# Show print statements
docker compose exec backend pytest -v -s

# Show full traceback
docker compose exec backend pytest -v --tb=long

# Stop on first failure
docker compose exec backend pytest -x

# Run last failed tests
docker compose exec backend pytest --lf
```

### Using pytest-pdb

```python
def test_something(client: TestClient):
    response = client.get("/api/v1/endpoint")
    import pdb; pdb.set_trace()  # Debugger breakpoint
    assert response.status_code == 200
```

## ⚠️ Skipped Tests

Some tests are marked with `@pytest.mark.skip` because they require:

- Existing database records (office_id, host_id, etc.)
- Email service configuration
- External service setup

To run these tests:

1. Set up required data in the database
2. Update test fixtures with real IDs
3. Remove the `@pytest.mark.skip` decorator

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Run tests
        run: |
          docker compose up -d
          docker compose exec -T backend pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 📚 Best Practices

1. **Use appropriate markers** - Mark tests as `unit`, `integration`, or `slow`
2. **Use fixtures** - Reuse common setup code via fixtures
3. **Test one thing** - Each test should verify one specific behavior
4. **Use descriptive names** - Test names should describe what they test
5. **Clean up** - Use fixtures with automatic rollback for database tests
6. **Mock external services** - Don't rely on external APIs in tests
7. **Test edge cases** - Include tests for error conditions and validation

## 🎓 Resources

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Coverage.py](https://coverage.readthedocs.io/)

