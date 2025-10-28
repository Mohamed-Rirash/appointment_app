import base64
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from loguru import logger as logging

from app.auth.config import get_auth_settings

settings = get_auth_settings()

auth_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


async def hash_password(plan_password: str):
    ph = PasswordHasher()
    hashed_password = ph.hash(plan_password)
    return hashed_password


async def verify_password(hashed_password: str, plan_password: str):
    ph = PasswordHasher()
    try:
        ph.verify(hashed_password, plan_password)
        return True
    except Exception:
        return False


def str_encode(string: str) -> str:
    return base64.b85encode(string.encode("ascii")).decode("ascii")


def str_decode(string: str) -> str:
    return base64.b85decode(string.encode("ascii")).decode("ascii")


def get_token_payload(token: str):
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=settings.JWT_ALGORITHM
        )
    except Exception as jwt_exec:
        logging.debug(f"JWT Error: {jwt_exec!s}")
        payload = None
    return payload


def generate_token(payload: dict, expiry: timedelta):
    expire = datetime.now(UTC) + expiry
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
