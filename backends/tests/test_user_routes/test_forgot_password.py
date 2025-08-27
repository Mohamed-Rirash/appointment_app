"""
1. User should be able to send forgot password request
2. User shoudl not be able to send forgot password request with invalid email address
3. Unverified should not be able to request forgot password email
4. InActive user should not be able to request forgot password email
"""
import pytest
from app.emails.email_config import fm

@pytest.mark.asyncio
async def test_user_can_send_forgot_password_request(client, user):
    fm.config.SUPPRESS_SEND = 0
    data = {'email': user.email}
    response = await client.post('/auth/forgot-password', json=data)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_user_can_not_send_forgot_password_request_with_invalid_email(client, user):
    data = {'email': 'invalid_email'}
    response = await client.post('/auth/forgot-password', json=data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_unverified_user_can_not_send_forgot_password_request(client, unverified_user):
    data = {'email': unverified_user.email}
    response = await client.post('/auth/forgot-password', json=data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_in_active_user_can_not_send_forgot_password_request(client, inactive_user):
    data = {'email': inactive_user.email}
    response = await client.post('/auth/forgot-password', json=data)
    assert response.status_code == 400
