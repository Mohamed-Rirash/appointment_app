"""
Tests for enhanced validation rules (password strength and email domain restrictions)
"""
import pytest
from pydantic import ValidationError
from httpx import AsyncClient

from app.auth.schemas import (
    UserCreate, PasswordChangeRequest, PasswordResetRequest, 
    PasswordResetConfirm, EmailVerificationRequest
)


class TestPasswordValidation:
    """Test enhanced password validation rules"""
    
    def test_valid_password(self):
        """Test that valid passwords pass validation"""
        valid_passwords = [
            "Password123!",
            "MySecure@Pass1",
            "Strong#Password9",
            "Complex$Pass123",
            "Secure&Pass456"
        ]
        
        for password in valid_passwords:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com",
                "password": password
            }
            
            # Should not raise validation error
            user = UserCreate(**user_data)
            assert user.password == password
    
    def test_password_too_short(self):
        """Test that passwords shorter than 8 characters are rejected"""
        short_passwords = [
            "Pass1!",      # 6 characters
            "Abc123!",     # 7 characters
            "1234567",     # 7 characters, no special chars
        ]
        
        for password in short_passwords:
            user_data = {
                "first_name": "Test",
                "last_name": "User", 
                "email": "test@gmail.com",
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "at least 8 characters" in str(exc_info.value)
    
    def test_password_missing_uppercase(self):
        """Test that passwords without uppercase letters are rejected"""
        passwords_no_upper = [
            "password123!",
            "mypass@word1",
            "lowercase#123"
        ]
        
        for password in passwords_no_upper:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com", 
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "at least one uppercase letter" in str(exc_info.value)
    
    def test_password_missing_lowercase(self):
        """Test that passwords without lowercase letters are rejected"""
        passwords_no_lower = [
            "PASSWORD123!",
            "MYPASS@WORD1",
            "UPPERCASE#123"
        ]
        
        for password in passwords_no_lower:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com",
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "at least one lowercase letter" in str(exc_info.value)
    
    def test_password_missing_digit(self):
        """Test that passwords without digits are rejected"""
        passwords_no_digit = [
            "Password!@#",
            "MySecure@Pass",
            "NoNumbers#Here"
        ]
        
        for password in passwords_no_digit:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com",
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "at least one digit" in str(exc_info.value)
    
    def test_password_missing_special_character(self):
        """Test that passwords without special characters are rejected"""
        passwords_no_special = [
            "Password123",
            "MySecurePass1",
            "NoSpecialChars123"
        ]
        
        for password in passwords_no_special:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com",
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "at least one special character" in str(exc_info.value)
    
    def test_password_change_validation(self):
        """Test password validation in password change request"""
        # Valid password change
        valid_request = PasswordChangeRequest(
            current_password="OldPass123!",
            new_password="NewPass456@"
        )
        assert valid_request.new_password == "NewPass456@"
        
        # Invalid new password
        with pytest.raises(ValidationError) as exc_info:
            PasswordChangeRequest(
                current_password="OldPass123!",
                new_password="weak"
            )
        assert "at least 8 characters" in str(exc_info.value)
    
    def test_password_reset_validation(self):
        """Test password validation in password reset"""
        # Valid password reset
        valid_reset = PasswordResetConfirm(
            token="valid-token",
            new_password="ResetPass789#"
        )
        assert valid_reset.new_password == "ResetPass789#"
        
        # Invalid new password
        with pytest.raises(ValidationError) as exc_info:
            PasswordResetConfirm(
                token="valid-token",
                new_password="NoSpecial123"
            )
        assert "at least one special character" in str(exc_info.value)


class TestEmailDomainValidation:
    """Test email domain restriction to @gmail.com only"""
    
    def test_valid_gmail_addresses(self):
        """Test that @gmail.com addresses are accepted"""
        valid_emails = [
            "user@gmail.com",
            "test.user@gmail.com",
            "user123@gmail.com",
            "user+tag@gmail.com",
            "user.name.123@gmail.com"
        ]
        
        for email in valid_emails:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": email,
                "password": "ValidPass123!"
            }
            
            # Should not raise validation error
            user = UserCreate(**user_data)
            assert user.email == email
    
    def test_invalid_email_domains(self):
        """Test that non-@gmail.com addresses are rejected"""
        invalid_emails = [
            "user@yahoo.com",
            "test@hotmail.com",
            "user@outlook.com",
            "admin@company.com",
            "user@example.org",
            "test@domain.net",
            "user@gmail.co",  # Close but not exact
            "user@gmail.com.fake",  # Fake subdomain
        ]
        
        for email in invalid_emails:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": email,
                "password": "ValidPass123!"
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert "Only @gmail.com email addresses are allowed" in str(exc_info.value)
    
    def test_case_insensitive_gmail_validation(self):
        """Test that email validation is case insensitive"""
        case_variations = [
            "user@GMAIL.COM",
            "user@Gmail.com", 
            "user@gmail.COM",
            "USER@gmail.com"
        ]
        
        for email in case_variations:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": email,
                "password": "ValidPass123!"
            }
            
            # Should not raise validation error
            user = UserCreate(**user_data)
            # Email should be normalized to lowercase by EmailStr
            assert "@gmail.com" in str(user.email).lower()
    
    def test_password_reset_email_validation(self):
        """Test email domain validation in password reset request"""
        # Valid gmail address
        valid_request = PasswordResetRequest(email="user@gmail.com")
        assert valid_request.email == "user@gmail.com"
        
        # Invalid domain
        with pytest.raises(ValidationError) as exc_info:
            PasswordResetRequest(email="user@yahoo.com")
        assert "Only @gmail.com email addresses are allowed" in str(exc_info.value)
    
    def test_email_verification_domain_validation(self):
        """Test email domain validation in email verification request"""
        # Valid gmail address
        valid_request = EmailVerificationRequest(email="verify@gmail.com")
        assert valid_request.email == "verify@gmail.com"
        
        # Invalid domain
        with pytest.raises(ValidationError) as exc_info:
            EmailVerificationRequest(email="verify@hotmail.com")
        assert "Only @gmail.com email addresses are allowed" in str(exc_info.value)


class TestAPIValidation:
    """Test validation through API endpoints"""
    
    @pytest.mark.asyncio
    async def test_user_registration_with_invalid_password(self, client: AsyncClient):
        """Test user registration with invalid password via API"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@gmail.com",
            "password": "weak"  # Invalid password
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422
        data = response.json()
        # FastAPI with Pydantic v2 returns validation errors in "detail" field
        assert "detail" in data
        assert "at least 8 characters" in str(data["detail"])
    
    @pytest.mark.asyncio
    async def test_user_registration_with_invalid_email_domain(self, client: AsyncClient):
        """Test user registration with invalid email domain via API"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@yahoo.com",  # Invalid domain
            "password": "ValidPass123!"
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422
        data = response.json()
        # FastAPI with Pydantic v2 returns validation errors in "detail" field
        assert "detail" in data
        assert "Only @gmail.com email addresses are allowed" in str(data["detail"])
    
    @pytest.mark.asyncio
    async def test_user_registration_with_valid_data(self, client: AsyncClient):
        """Test user registration with valid data via API"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "valid.test@gmail.com",
            "password": "ValidPass123!"
        }
        
        response = await client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User created successfully"
    
    @pytest.mark.asyncio
    async def test_password_change_with_weak_password(self, client: AsyncClient, auth_headers: dict):
        """Test password change with weak password via API"""
        password_data = {
            "current_password": "ValidPass123!",
            "new_password": "weak"  # Invalid password
        }
        
        response = await client.post(
            "/api/v1/users/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        data = response.json()
        # FastAPI with Pydantic v2 returns validation errors in "detail" field
        assert "detail" in data


class TestValidationMessages:
    """Test that validation error messages are clear and helpful"""
    
    def test_password_validation_error_messages(self):
        """Test that password validation provides clear error messages"""
        test_cases = [
            ("short", "at least 8 characters"),
            ("nouppercase123!", "at least one uppercase letter"),
            ("NOLOWERCASE123!", "at least one lowercase letter"),
            ("NoDigitsHere!", "at least one digit"),
            ("NoSpecialChars123", "at least one special character"),
        ]
        
        for password, expected_message in test_cases:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@gmail.com",
                "password": password
            }
            
            with pytest.raises(ValidationError) as exc_info:
                UserCreate(**user_data)
            
            assert expected_message in str(exc_info.value)
    
    def test_email_validation_error_message(self):
        """Test that email validation provides clear error message"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@yahoo.com",
            "password": "ValidPass123!"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)
        
        assert "Only @gmail.com email addresses are allowed" in str(exc_info.value)
