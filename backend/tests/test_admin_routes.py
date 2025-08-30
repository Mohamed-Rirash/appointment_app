import pytest
from databases import Database
from httpx import AsyncClient

from app.auth.crud import UserCRUD
from app.auth.dependencies import CurrentUser, require_verified_user
from app.auth.rbac import RBACCRUD, RoleCRUD
from app.core.security import hash_password
from app.main import app


@pytest.fixture
def override_admin_permissions(super_admin_user: dict):
    """Override require_verified_user to inject a super admin with all needed permissions."""
    # Minimal permission set required by routes.py
    perms = [
        {"name": "users:create"},
        {"name": "users:read"},
        {"name": "users:update"},
        {"name": "users:delete"},
        {"name": "roles:assign"},
        {"name": "roles:revoke"},
        {"name": "roles:read"},
    ]

    async def _override():
        return CurrentUser(super_admin_user, permissions=perms)

    # Apply override
    app.dependency_overrides[require_verified_user] = _override
    yield
    # Clear override
    app.dependency_overrides.pop(require_verified_user, None)


@pytest.mark.asyncio
async def test_admin_create_get_list_update_delete_user(
    client: AsyncClient,
    db_session: Database,
    override_admin_permissions,
):
    # Create user
    payload = {
        "first_name": "Route",
        "last_name": "Test",
        "email": "route.test@example.com",
        "password": "StrongPass123!",
        "is_active": True,
        "is_verified": True,
        "send_welcome_email": False,
    }
    r = await client.post("/api/v1/admin/users", json=payload)
    assert r.status_code == 201
    created = r.json()
    user_id = created["id"]
    assert created["email"] == payload["email"]

    # List users
    r = await client.get("/api/v1/admin/users?page=1&size=10")
    assert r.status_code == 200
    data = r.json()
    assert "appointments" in data and isinstance(data["appointments"], list)
    assert any(u["email"] == payload["email"] for u in data["appointments"]) or any(
        u.get("email") == payload["email"] for u in data["appointments"]
    )

    # Get user by id
    r = await client.get(f"/api/v1/admin/users/{user_id}")
    assert r.status_code == 200
    fetched = r.json()
    assert fetched["id"] == user_id

    # Update user
    update = {"first_name": "Updated"}
    r = await client.put(f"/api/v1/admin/users/{user_id}", json=update)
    assert r.status_code == 200
    updated = r.json()
    assert updated["first_name"] == "Updated"

    # Delete user
    r = await client.delete(f"/api/v1/admin/users/{user_id}")
    assert r.status_code == 200
    assert r.json().get("success") is True


@pytest.mark.asyncio
async def test_admin_activate_deactivate_suspend_and_resend_invite(
    client: AsyncClient,
    db_session: Database,
    override_admin_permissions,
):
    # Create a user directly in DB for state-change tests
    user = await UserCRUD.create(
        db_session,
        {
            "first_name": "State",
            "last_name": "User",
            "email": "state.user@example.com",
            "password": await hash_password("AnotherPass123!"),
            "is_active": False,
            "is_verified": True,
        },
    )

    # Activate
    r = await client.patch(f"/api/v1/admin/users/{user['id']}/activate")
    assert r.status_code == 200

    # Deactivate
    r = await client.patch(f"/api/v1/admin/users/{user['id']}/deactivate")
    assert r.status_code == 200

    # Suspend (same behavior as deactivate per implementation)
    r = await client.patch(f"/api/v1/admin/users/{user['id']}/suspend")
    assert r.status_code == 200

    # Resend invite
    r = await client.post(f"/api/v1/admin/users/{user['id']}/resend-invite")
    assert r.status_code == 200
    assert r.json().get("message")


@pytest.mark.asyncio
async def test_admin_roles_list_assign_revoke_by_name(
    client: AsyncClient,
    db_session: Database,
    override_admin_permissions,
):
    # Create role by name
    role = await RoleCRUD.create(
        db_session,
        {
            "name": "tester",
            "display_name": "Tester",
            "description": "Testing role",
            "is_active": True,
            "is_system": False,
        },
        created_by="system",
    )

    # Create user
    user = await UserCRUD.create(
        db_session,
        {
            "first_name": "Role",
            "last_name": "Subject",
            "email": "role.subject@example.com",
            "password": await hash_password("S3cretPass!"),
            "is_active": True,
            "is_verified": True,
        },
    )

    # Assign by name
    r = await client.post(f"/api/v1/admin/users/{user['id']}/roles/{role['name']}")
    assert r.status_code == 200

    # Verify roles/permissions endpoint
    r = await client.get(f"/api/v1/admin/users/{user['id']}/roles")
    assert r.status_code == 200
    data = r.json()
    assert role["name"] in data.get("roles", [])

    # Revoke by name
    r = await client.delete(f"/api/v1/admin/users/{user['id']}/roles/{role['name']}")
    assert r.status_code == 200

    # Confirm removal
    roles = await RBACCRUD.get_user_roles(db_session, user["id"])
    assert all(r["name"] != role["name"] for r in roles)
