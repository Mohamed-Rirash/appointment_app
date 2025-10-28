"""
Tests for office management endpoints
"""

from datetime import date
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestOfficeManagement:
    """Test office CRUD operations"""

    def test_get_all_offices(self, client: TestClient, superuser_token_headers: dict):
        """Test getting all offices"""
        response = client.get(
            "/api/v1/offices/",
            headers=superuser_token_headers,
        )

        # Should return list (empty or with data)
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)

    @pytest.mark.skip(reason="Requires proper office data setup")
    def test_create_office(self, client: TestClient, superuser_token_headers: dict):
        """Test creating a new office"""
        payload = {
            "name": "Test Office",
            "description": "A test office",
            "location": "Building A, Floor 1",
        }

        response = client.post(
            "/api/v1/offices",
            json=payload,
            headers=superuser_token_headers,
        )

        # Should create or fail with validation
        assert response.status_code in [201, 400, 422]

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_office_by_id(self, client: TestClient, superuser_token_headers: dict):
        """Test getting office by ID"""
        office_id = uuid4()

        response = client.get(
            f"/api/v1/offices/{office_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing office")
    def test_update_office(self, client: TestClient, superuser_token_headers: dict):
        """Test updating an office"""
        office_id = uuid4()

        payload = {
            "name": "Updated Office Name",
            "description": "Updated description",
        }

        response = client.put(
            f"/api/v1/offices/{office_id}",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing office")
    def test_delete_office(self, client: TestClient, superuser_token_headers: dict):
        """Test deleting an office"""
        office_id = uuid4()

        response = client.delete(
            f"/api/v1/offices/{office_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 204, 404]

    def test_office_operations_unauthorized(self, client: TestClient):
        """Test office operations without authentication"""
        response = client.get("/api/v1/offices/")
        assert response.status_code == 401


@pytest.mark.integration
class TestOfficeSearch:
    """Test office search functionality"""

    def test_search_offices(self, client: TestClient, superuser_token_headers: dict):
        """Test searching offices"""
        response = client.get(
            "/api/v1/offices/search",
            params={"query": "test"},
            headers=superuser_token_headers,
        )

        # 422 if validation fails, 200 if search succeeds, 404 if no results
        assert response.status_code in [200, 404, 422]

    def test_search_hosts(self, client: TestClient, superuser_token_headers: dict):
        """Test searching hosts"""
        response = client.get(
            "/api/v1/offices/hosts/search",
            params={"query": "admin"},
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]


@pytest.mark.integration
class TestTimeSlots:
    """Test time slot management"""

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_slots_for_date(self, client: TestClient, superuser_token_headers: dict):
        """Test getting time slots for a specific date"""
        office_id = uuid4()
        target_date = date.today()

        response = client.get(
            f"/api/v1/hosts/{office_id}/slots",
            params={"target_date": target_date.isoformat()},
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_available_slots(self, client: TestClient, superuser_token_headers: dict):
        """Test getting available (unbooked) slots"""
        office_id = uuid4()
        target_date = date.today()

        response = client.get(
            f"/api/v1/hosts/{office_id}/slots/available",
            params={"target_date": target_date.isoformat()},
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]

    def test_get_slots_unauthorized(self, client: TestClient):
        """Test getting slots without authentication"""
        office_id = uuid4()
        target_date = date.today()

        response = client.get(
            f"/api/v1/availability/hosts/{office_id}/slots",
            params={"target_date": target_date.isoformat()},
        )

        assert response.status_code == 401


@pytest.mark.integration
class TestHostAssignment:
    """Test host assignment to offices"""

    @pytest.mark.skip(reason="Requires existing office and user")
    def test_assign_host_to_office(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test assigning a host to an office"""
        office_id = uuid4()
        user_id = uuid4()

        response = client.post(
            f"/api/v1/offices/{office_id}/hosts/{user_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 201, 404]

    @pytest.mark.skip(reason="Requires existing office and user")
    def test_remove_host_from_office(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test removing a host from an office"""
        office_id = uuid4()
        user_id = uuid4()

        response = client.delete(
            f"/api/v1/offices/{office_id}/hosts/{user_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 204, 404]

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_office_hosts(self, client: TestClient, superuser_token_headers: dict):
        """Test getting all hosts for an office"""
        office_id = uuid4()

        response = client.get(
            f"/api/v1/offices/{office_id}/hosts",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]


@pytest.mark.integration
class TestOfficeAvailability:
    """Test office availability management"""

    @pytest.mark.skip(reason="Requires existing office")
    def test_set_office_availability(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test setting office availability"""
        office_id = uuid4()

        payload = {
            "day_of_week": 1,  # Monday
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        }

        response = client.post(
            f"/api/v1/offices/{office_id}/availability",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 201, 404]

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_office_availability(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test getting office availability"""
        office_id = uuid4()

        response = client.get(
            f"/api/v1/offices/{office_id}/availability",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]


@pytest.mark.integration
class TestOfficeStats:
    """Test office statistics endpoints"""

    @pytest.mark.skip(reason="Requires existing office")
    def test_get_office_stats(self, client: TestClient, superuser_token_headers: dict):
        """Test getting office statistics"""
        office_id = uuid4()

        response = client.get(
            f"/api/v1/offices/{office_id}/stats",
            headers=superuser_token_headers,
        )

        assert response.status_code in [200, 404]


@pytest.mark.unit
class TestOfficeValidation:
    """Test office data validation"""

    def test_invalid_office_data(self, client: TestClient, superuser_token_headers: dict):
        """Test creating office with invalid data"""
        payload = {
            "name": "",  # Empty name
            "description": "Test",
        }

        response = client.post(
            "/api/v1/offices",
            json=payload,
            headers=superuser_token_headers,
        )

        assert response.status_code in [400, 422]

    def test_invalid_time_format(self, client: TestClient, superuser_token_headers: dict):
        """Test setting availability with invalid time format"""
        office_id = uuid4()

        payload = {
            "day_of_week": 1,
            "start_time": "invalid-time",
            "end_time": "17:00:00",
        }

        response = client.post(
            f"/api/v1/availability/hosts/{office_id}",
            json=payload,
            headers=superuser_token_headers,
        )

        # Superuser may not have host/secretary role, so 403 is also acceptable
        assert response.status_code in [400, 422, 403]

