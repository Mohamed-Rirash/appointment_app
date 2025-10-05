import { CredentialsSignin } from "next-auth";

// Base class for all authentication errors
export class AuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

// Specific error types
export class InvalidCredentials extends AuthError {
  code = "invalid_credentials";
}

export class AccountNotVerified extends AuthError {
  code = "account_not_verified";
}

export class TooManyAttempts extends AuthError {
  code = "too_many_attempts";
}