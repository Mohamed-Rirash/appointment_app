import pytest
from httpx import AsyncClient
from databases import Database

from app.core.security import hash_password, generate_password_reset_token
from app.auth.crud import UserCRUD


@pytest.mark.asyncio
async def test_refresh_with_cookie_and_body(client: AsyncClient, db_session: Database, test_user: dict):
    """Refresh should read token from cookie primarily, and body as fallback."""
    # Simulate login by issuing a real refresh token via password set token flow
    # For this test, we directly set a refresh cookie by using the password reset token as a stand-in
    # Proper flow: login endpoint would set cookie, but here we focus on refresh endpoint behavior.
    from app.core.security import create_refresh_token

    refresh_token = create_refresh_token(test_user["id"])  # JWT refresh

    # Cookie-first
    r = await client.post(
        "/api/v1/users/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data and data["token_type"] == "bearer"

    # Body fallback (no cookie set)
    r = await client.post(
        "/api/v1/users/refresh",
        json={"refresh_token": refresh_token},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_resend_verification_and_set_password(client: AsyncClient, db_session: Database):
    # Create unverified user
    user = await UserCRUD.create(
        db_session,
        {
            "first_name": "Email",
            "last_name": "Verify",
            "email": "verify.me@example.com",
            "password": await hash_password("TempPass123!"),
            "is_active": True,
            "is_verified": False,
        },
    )

    # Resend verification (idempotent style)
    r = await client.post(
        "/api/v1/users/resend-verification",
        json={"email": user["email"]},
    )
    assert r.status_code == 200

    # Simulate invite/reset flow: set password with token
    token = generate_password_reset_token(user["id"])  # used by both set-password and reset-password
    r = await client.post(
        "/api/v1/users/set-password",
        json={"token": token, "new_password": "BrandNewPass123!"},
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_request_and_reset_password_flow(client: AsyncClient, db_session: Database, test_user: dict):
    # Request reset (should always return 200)
    r = await client.post(
        "/api/v1/users/request-password-reset",
        json={"email": test_user["email"]},
    )
    assert r.status_code == 200

    # Use a generated token to reset
    token = generate_password_reset_token(test_user["id"])  # valid for reset-password
    r = await client.post(
        "/api/v1/users/reset-password",
        json={"token": token, "new_password": "AnotherPass123!"},
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_profile_requires_auth_and_returns_roles_perms(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/v1/users/me", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "id" in data and isinstance(data.get("roles", []), list)
    assert isinstance(data.get("permissions", []), list)


@pytest.mark.asyncio
async def test_change_password_happy_and_failure_cases(client: AsyncClient, auth_headers: dict):
    # Wrong current
    r = await client.post(
        "/api/v1/users/change-password",
        json={"current_password": "WrongPass!", "new_password": "NewStrongPass123!"},
        headers=auth_headers,
    )
    assert r.status_code in (400, 401)

    # Correct current must match fixture's default password
    r = await client.post(
        "/api/v1/users/change-password",
        json={"current_password": "TestPass123!", "new_password": "NewStrongPass123!"},
        headers=auth_headers,
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_logout_requires_auth(client: AsyncClient, auth_headers: dict):
    r = await client.post("/api/v1/users/logout", headers=auth_headers)
    assert r.status_code == 200
    # Without auth -> 401
    r = await client.post("/api/v1/users/logout")
    assert r.status_code == 401
