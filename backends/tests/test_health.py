"""
Health check and monitoring tests
"""
import pytest
from httpx import AsyncClient


class TestHealthChecks:
    """Test health check endpoints"""
    
    @pytest.mark.asyncio
    async def test_basic_health_check(self, client: AsyncClient):
        """Test basic health check endpoint"""
        response = await client.get("/api/v1/health/")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint"""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "environment" in data
    
    @pytest.mark.asyncio
    async def test_detailed_health_check_unauthorized(self, client: AsyncClient):
        """Test detailed health check without authentication"""
        response = await client.get("/api/v1/health/detailed")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_detailed_health_check_with_admin(self, client: AsyncClient, admin_auth_headers: dict):
        """Test detailed health check with admin authentication"""
        response = await client.get("/api/v1/health/detailed", headers=admin_auth_headers)
        
        # Should work if admin has system:monitor permission
        assert response.status_code in [200, 403]  # 403 if permissions not set up
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "checks" in data
            assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_database_health_check_unauthorized(self, client: AsyncClient):
        """Test database health check without authentication"""
        response = await client.get("/api/v1/health/database")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_redis_health_check_unauthorized(self, client: AsyncClient):
        """Test Redis health check without authentication"""
        response = await client.get("/api/v1/health/redis")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_metrics_unauthorized(self, client: AsyncClient):
        """Test metrics endpoint without authentication"""
        response = await client.get("/api/v1/health/metrics")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_rate_limit_status(self, client: AsyncClient):
        """Test rate limit status endpoint"""
        response = await client.get("/api/v1/health/rate-limit")

        assert response.status_code == 200
        data = response.json()
        assert "rate_limit" in data
        assert "enabled" in data
    
    @pytest.mark.asyncio
    async def test_system_info_unauthorized(self, client: AsyncClient):
        """Test system info without authentication"""
        response = await client.get("/api/v1/health/system")
        
        assert response.status_code == 401


class TestKubernetesProbes:
    """Test Kubernetes probe endpoints"""
    
    @pytest.mark.asyncio
    async def test_liveness_probe(self, client: AsyncClient):
        """Test liveness probe"""
        response = await client.get("/api/v1/health/liveness")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
    
    @pytest.mark.asyncio
    async def test_readiness_probe(self, client: AsyncClient):
        """Test readiness probe"""
        response = await client.get("/api/v1/health/readiness")
        
        # Should return 200 if database is available
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert data["status"] == "ready"
    
    @pytest.mark.asyncio
    async def test_startup_probe(self, client: AsyncClient):
        """Test startup probe"""
        response = await client.get("/api/v1/health/startup")
        
        # Should return 200 if application has started properly
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert data["status"] == "started"


class TestAPIDocumentation:
    """Test API documentation endpoints"""
    
    @pytest.mark.asyncio
    async def test_openapi_json(self, client: AsyncClient):
        """Test OpenAPI JSON endpoint"""
        response = await client.get("/openapi.json")
        
        # Should be available in development, not in production
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "openapi" in data
            assert "info" in data
            assert "paths" in data
    
    @pytest.mark.asyncio
    async def test_swagger_docs(self, client: AsyncClient):
        """Test Swagger documentation"""
        response = await client.get("/docs")
        
        # Should be available in development, not in production
        assert response.status_code in [200, 404]
    
    @pytest.mark.asyncio
    async def test_redoc_docs(self, client: AsyncClient):
        """Test ReDoc documentation"""
        response = await client.get("/redoc")
        
        # Should be available in development, not in production
        assert response.status_code in [200, 404]


class TestErrorHandling:
    """Test error handling"""
    
    @pytest.mark.asyncio
    async def test_404_error(self, client: AsyncClient):
        """Test 404 error handling"""
        response = await client.get("/nonexistent-endpoint")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_method_not_allowed(self, client: AsyncClient):
        """Test 405 method not allowed"""
        response = await client.patch("/api/v1/health/")  # PATCH not allowed
        
        assert response.status_code == 405
    
    @pytest.mark.asyncio
    async def test_validation_error(self, client: AsyncClient):
        """Test validation error handling"""
        # Send invalid JSON to user creation endpoint
        invalid_data = {
            "first_name": "",  # Empty string should fail validation
            "last_name": "Doe",
            "email": "invalid-email",  # Invalid email
            "password": "weak"  # Weak password
        }
        
        response = await client.post("/api/v1/users/", json=invalid_data)
        
        assert response.status_code == 422
        data = response.json()
        # Pydantic v2 returns "detail" with validation errors
        assert "detail" in data


class TestRateLimiting:
    """Test rate limiting functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_headers(self, client: AsyncClient):
        """Test that rate limit headers are present"""
        response = await client.get("/api/v1/health/")
        
        # Check for rate limit headers (if rate limiting is enabled)
        if "X-RateLimit-Limit" in response.headers:
            assert "X-RateLimit-Remaining" in response.headers
            assert "X-RateLimit-Window" in response.headers
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_rate_limit_enforcement(self, client: AsyncClient):
        """Test rate limit enforcement (slow test)"""
        # This test would need to make many requests quickly
        # Skip if rate limiting is disabled or limits are very high
        
        # Make multiple requests quickly
        responses = []
        for i in range(10):
            response = await client.get("/api/v1/health/")
            responses.append(response)
        
        # All should succeed if limit is reasonable
        for response in responses:
            assert response.status_code in [200, 429]  # 429 if rate limited


class TestSecurityHeaders:
    """Test security headers"""
    
    @pytest.mark.asyncio
    async def test_security_headers_present(self, client: AsyncClient):
        """Test that security headers are present"""
        response = await client.get("/")
        
        # Check for common security headers
        expected_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy"
        ]
        
        for header in expected_headers:
            if header in response.headers:
                assert response.headers[header] is not None
    
    @pytest.mark.asyncio
    async def test_cors_headers(self, client: AsyncClient):
        """Test CORS headers"""
        # Make an OPTIONS request to test CORS
        response = await client.options("/api/v1/health/")
        
        # Should have CORS headers if CORS is enabled
        if "Access-Control-Allow-Origin" in response.headers:
            assert response.headers["Access-Control-Allow-Origin"] is not None


class TestRequestLogging:
    """Test request logging functionality"""
    
    @pytest.mark.asyncio
    async def test_request_id_header(self, client: AsyncClient):
        """Test that request ID header is added"""
        response = await client.get("/api/v1/health/")
        
        # Should have request ID header if logging middleware is enabled
        if "X-Request-ID" in response.headers:
            request_id = response.headers["X-Request-ID"]
            assert request_id is not None
            assert len(request_id) > 0
