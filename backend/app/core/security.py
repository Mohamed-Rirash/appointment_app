import os
import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt
from loguru import logger

from app.config import get_settings
from app.core.cache import cache_manager

settings = get_settings()
ph = PasswordHasher()


class SecurityError(Exception):
    """Base security exception"""


class TokenError(SecurityError):
    """Token-related security exception"""


async def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    try:
        return ph.hash(password)
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        raise SecurityError("Password hashing failed")


async def verify_password(hashed_password: str, plain_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False


def generate_password(length: int = 12) -> str:
    """Generate a secure random password"""
    import secrets
    import string

    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*"

    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + special
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))

    # Shuffle the password list
    secrets.SystemRandom().shuffle(password)

    return "".join(password)


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_api_key(prefix: str = "ak", length: int = 32) -> str:
    """Generate an API key with prefix"""
    token = generate_secure_token(length)
    return f"{prefix}_{token}"


def _base_jwt_claims(
    subject: str | UUID, expires_delta: timedelta | None
) -> dict[str, Any]:
    now = datetime.now(UTC)
    exp = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    claims: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": exp,
        "jti": secrets.token_hex(16),
    }
    # Optional issuer/audience from settings if provided
    iss = getattr(settings, "JWT_ISSUER", None)
    aud = getattr(settings, "JWT_AUDIENCE", None)
    if iss:
        claims["iss"] = iss
    if aud:
        claims["aud"] = aud
    return claims


def create_access_token(
    subject: str | UUID,
    expires_delta: timedelta | None = None,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    """Create a JWT access token with hardened defaults."""
    to_encode = _base_jwt_claims(subject, expires_delta)
    to_encode["type"] = "access"
    if additional_claims:
        to_encode.update(additional_claims)
    try:
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    except Exception as e:
        logger.error(f"Token creation failed: {e}")
        raise TokenError("Token creation failed")


def create_refresh_token(
    subject: str | UUID, expires_delta: timedelta | None = None
) -> str:
    """Create a JWT refresh token with hardened defaults."""
    if not expires_delta:
        expires_delta = timedelta(days=7)
    to_encode = _base_jwt_claims(subject, expires_delta)
    to_encode["type"] = "refresh"
    try:
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    except Exception as e:
        logger.error(f"Refresh token creation failed: {e}")
        raise TokenError("Refresh token creation failed")


def verify_token(token: str, token_type: str = "access") -> dict[str, Any]:
    """Verify and decode a JWT token with issuer/audience enforcement if configured."""
    try:
        decode_kwargs: dict[str, Any] = {
            "key": settings.SECRET_KEY,
            "algorithms": [settings.ALGORITHM],
            "options": {"verify_aud": bool(getattr(settings, "JWT_AUDIENCE", None))},
        }
        iss = getattr(settings, "JWT_ISSUER", None)
        aud = getattr(settings, "JWT_AUDIENCE", None)
        if aud:
            decode_kwargs["audience"] = aud
        payload = jwt.decode(
            token, **decode_kwargs
        )  # jose verifies exp, iat, nbf by default
        if iss and payload.get("iss") != iss:
            raise TokenError("Invalid token issuer")
        # Type check
        if payload.get("type") != token_type:
            raise TokenError(f"Invalid token type. Expected {token_type}")
        return payload
    except JWTError:
        logger.warning("JWT verification failed")
        raise TokenError("Invalid token")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise TokenError("Token verification failed")


# --------------------
# JWT denylist (jti-based)
# --------------------


def _denylist_key(jti: str) -> str:
    return f"jwt:deny:jti:{jti}"


async def is_jti_revoked(jti: str | None) -> bool:
    """Check if a JWT jti is revoked using Redis denylist."""
    if not jti or not settings.JWT_DENYLIST_ENABLED:
        return False
    try:
        return await cache_manager.exists(_denylist_key(jti))
    except Exception:
        # Fail-open to avoid auth outages if cache is down
        return False


async def revoke_token_jti(jti: str | None, exp_ts: int | None) -> bool:
    """Revoke a JWT by jti until its expiration using Redis denylist.

    Args:
        jti: token unique id
        exp_ts: expiration timestamp (seconds since epoch)
    """
    if not jti or not settings.JWT_DENYLIST_ENABLED:
        return False
    try:
        # Compute TTL from exp
        ttl = None
        if isinstance(exp_ts, int):
            now = int(datetime.now(UTC).timestamp())
            ttl = max(0, exp_ts - now)
        # Use small default TTL to avoid permanent entries if exp missing
        if ttl is None:
            ttl = 60 * 60
        return await cache_manager.set(_denylist_key(jti), True, ttl=ttl)
    except Exception:
        return False


def generate_password_reset_token(user_id: str | UUID) -> str:
    """Generate a password reset token"""
    expires_delta = timedelta(hours=24)  # 24 hours
    return create_access_token(
        subject=user_id,
        expires_delta=expires_delta,
        additional_claims={"type": "password_reset"},
    )


def verify_password_reset_token(token: str) -> str | None:
    """Verify a password reset token and return user ID"""
    try:
        payload = verify_token(token, token_type="password_reset")
        return payload.get("sub")
    except TokenError:
        return None


def generate_email_verification_token(user_id: str | UUID) -> str:
    """Generate an email verification token"""
    expires_delta = timedelta(hours=48)  # 48 hours
    return create_access_token(
        subject=user_id,
        expires_delta=expires_delta,
        additional_claims={"type": "email_verification"},
    )


def verify_email_verification_token(token: str) -> str | None:
    """Verify an email verification token and return user ID"""
    try:
        payload = verify_token(token, token_type="email_verification")
        return payload.get("sub")
    except TokenError:
        return None


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename for security"""
    # Normalize and strip directory components
    name = os.path.basename(filename or "")
    # Remove null bytes and control chars
    name = "".join(ch for ch in name if ch.isprintable())
    name = name.replace("\x00", "")
    # Allowlist basic characters (letters, digits, dash, underscore, dot, space)
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_. ")
    name = "".join(ch if ch in allowed else "_" for ch in name)
    # Collapse consecutive dots and spaces
    while ".." in name:
        name = name.replace("..", ".")
    name = name.strip().strip(".")
    if not name:
        name = "file"
    # Limit length
    return name[:255]


def is_safe_url(url: str, allowed_hosts: list[str] | None = None) -> bool:
    """Check if a URL is safe for redirects"""
    if not url:
        return False
    from urllib.parse import urlparse

    parsed = urlparse(url)
    # Only allow http/https schemes
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return False
    # Disallow javascript/data/vbscript implicitly by scheme check above
    # Ensure netloc is in allowed hosts if provided (for absolute URLs)
    if allowed_hosts and parsed.netloc and parsed.netloc not in allowed_hosts:
        return False
    # Prevent CRLF injection in path/query/fragment
    combined = (parsed.path or "") + (parsed.query or "") + (parsed.fragment or "")
    if "\r" in combined or "\n" in combined:
        return False
    return True
