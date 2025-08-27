"""
1. User should be able to reset his password with conmbination of valid token and valid email
2. User can not reset password with invalid token
3. User can not reset password with invalid email
4. User can not reset password with any email and valid token
"""

import pytest
from app.auth.security import hash_password
from app.auth.constants import FORGOT_PASSWORD


NEW_PASSWORD = "321#Describly"

async def _get_token(user):
    string_context = user.get_context_string(context=FORGOT_PASSWORD)
    return await hash_password(string_context)

@pytest.mark.asyncio
async def test_reset_password(client, user):
    data = {
        "token": await _get_token(user),
        "email": user.email,
        "password": NEW_PASSWORD
    }
    response = await client.put("/auth/reset-password", json=data)
    assert response.status_code == 200
    del data['token']
    del data['email']
    data['username'] = user.email
    login_resp = await client.post("/auth/login", data=data)
    assert login_resp.status_code == 200
    
@pytest.mark.asyncio
async def test_reset_password_invalid_token(client, user):
    data = {
        "token": "sakjdhajksdhaksjhdjkadh",
        "email": user.email,
        "password": NEW_PASSWORD
    }
    response = await client.put("/auth/reset-password", json=data)
    assert response.status_code == 400
    del data['token']
    del data['email']
    data['username'] = user.email
    login_resp = await client.post("/auth/login", data=data)
    assert login_resp.status_code != 200

@pytest.mark.asyncio
async def test_reset_password_invalid_email(client, user):
    data = {
        "token": await _get_token(user),
        "email": "describly.com",
        "password": NEW_PASSWORD
    }
    response = await client.put("/auth/reset-password", json=data)
    assert response.status_code == 422
    del data['token']
    del data['email']
    data['username'] = user.email
    login_resp = await client.post("/auth/login", data=data)
    assert login_resp.status_code != 200

@pytest.mark.asyncio
async def test_reset_password_invalid_email_2(client, user):
    data = {
        "token": await _get_token(user),
        "email": "nandan@describly.com",
        "password": NEW_PASSWORD
    }
    response = await client.put("/auth/reset-password", json=data)
    assert response.status_code == 400
    del data['token']
    del data['email']
    data['username'] = user.email
    login_resp = await client.post("/auth/login", data=data)
    assert login_resp.status_code != 200
