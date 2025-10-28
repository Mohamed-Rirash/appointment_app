"""
Core validation utilities for the application
"""

from app.config import get_settings

settings = get_settings()


def validate_email_domain(email: str) -> str:
    """
    Validate email domain against allowed domains

    Args:
        email: Email address to validate

    Returns:
        str: The validated email address

    Raises:
        ValueError: If email domain is not allowed
    """
    if not settings.ENFORCE_EMAIL_DOMAIN:
        return email

    email_lower = email.lower()
    allowed_domains = [domain.lower() for domain in settings.ALLOWED_EMAIL_DOMAINS]

    # Check if email ends with any of the allowed domains
    domain_allowed = any(
        email_lower.endswith(f"@{domain}") for domain in allowed_domains
    )

    if not domain_allowed:
        if len(allowed_domains) == 1:
            raise ValueError(f"Only @{allowed_domains[0]} email addresses are allowed")
        else:
            domains_str = ", ".join(f"@{domain}" for domain in allowed_domains)
            raise ValueError(
                f"Only email addresses from these domains are allowed: {domains_str}"
            )

    return email


def validate_password_strength(password: str) -> str:
    """
    Validate password strength requirements

    Args:
        password: Password to validate

    Returns:
        str: The validated password

    Raises:
        ValueError: If password doesn't meet strength requirements
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")

    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")

    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter")

    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit")

    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        raise ValueError(
            "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
        )

    return password


def get_password_requirements() -> dict:
    """
    Get password requirements for client-side validation

    Returns:
        dict: Password requirements specification
    """
    return {
        "min_length": 8,
        "max_length": 128,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_digit": True,
        "require_special": True,
        "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?",
        "description": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    }


def get_email_requirements() -> dict:
    """
    Get email requirements for client-side validation

    Returns:
        dict: Email requirements specification
    """
    return {
        "enforce_domain": settings.ENFORCE_EMAIL_DOMAIN,
        "allowed_domains": settings.ALLOWED_EMAIL_DOMAINS,
        "description": (
            f"Only email addresses from these domains are allowed: {', '.join(f'@{domain}' for domain in settings.ALLOWED_EMAIL_DOMAINS)}"
            if settings.ENFORCE_EMAIL_DOMAIN
            else "Any valid email address is allowed"
        ),
    }


def validate_user_input(
    email: str = "",
    password: str = "",
    skip_email_domain: bool = False,
    skip_password_strength: bool = False,
) -> dict:
    """
    Validate user input (email and password)

    Args:
        email: Email to validate (optional)
        password: Password to validate (optional)
        skip_email_domain: Skip email domain validation
        skip_password_strength: Skip password strength validation

    Returns:
        dict: Validation results

    Raises:
        ValueError: If validation fails
    """
    results = {"email_valid": True, "password_valid": True, "errors": []}

    # Validate email
    if email is not None:
        try:
            if not skip_email_domain:
                validate_email_domain(email)
        except ValueError as e:
            results["email_valid"] = False
            results["errors"].append(f"Email: {e!s}")

    # Validate password
    if password is not None:
        try:
            if not skip_password_strength:
                validate_password_strength(password)
        except ValueError as e:
            results["password_valid"] = False
            results["errors"].append(f"Password: {e!s}")

    # Overall validation status
    results["valid"] = results["email_valid"] and results["password_valid"]

    if not results["valid"]:
        raise ValueError("; ".join(results["errors"]))

    return results


# Password strength checker for different levels
def check_password_strength_level(password: str) -> dict:
    """
    Check password strength and return detailed analysis

    Args:
        password: Password to analyze

    Returns:
        dict: Detailed password strength analysis
    """
    analysis = {
        "length": len(password),
        "has_uppercase": any(c.isupper() for c in password),
        "has_lowercase": any(c.islower() for c in password),
        "has_digit": any(c.isdigit() for c in password),
        "has_special": any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password),
        "score": 0,
        "level": "weak",
        "feedback": [],
    }

    # Calculate score
    if analysis["length"] >= 8:
        analysis["score"] += 1
    if analysis["length"] >= 12:
        analysis["score"] += 1
    if analysis["has_uppercase"]:
        analysis["score"] += 1
    if analysis["has_lowercase"]:
        analysis["score"] += 1
    if analysis["has_digit"]:
        analysis["score"] += 1
    if analysis["has_special"]:
        analysis["score"] += 1

    # Determine level
    if analysis["score"] >= 6:
        analysis["level"] = "strong"
    elif analysis["score"] >= 4:
        analysis["level"] = "medium"
    else:
        analysis["level"] = "weak"

    # Generate feedback
    if analysis["length"] < 8:
        analysis["feedback"].append("Use at least 8 characters")
    if not analysis["has_uppercase"]:
        analysis["feedback"].append("Add uppercase letters")
    if not analysis["has_lowercase"]:
        analysis["feedback"].append("Add lowercase letters")
    if not analysis["has_digit"]:
        analysis["feedback"].append("Add numbers")
    if not analysis["has_special"]:
        analysis["feedback"].append("Add special characters")

    if not analysis["feedback"]:
        analysis["feedback"].append("Password meets all requirements")

    return analysis
