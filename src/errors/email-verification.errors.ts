/**
 * Typed error classes for the email verification flow.
 * Controllers map these to HTTP responses without string matching.
 */

export class TokenExpiredError extends Error {
  readonly code = "TOKEN_EXPIRED" as const;

  constructor(message = "Verification token has expired") {
    super(message);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends Error {
  readonly code = "INVALID_TOKEN" as const;

  constructor(
    message = "Verification token is invalid or has already been used",
  ) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

export class MissingTokenError extends Error {
  readonly code = "MISSING_TOKEN" as const;

  constructor(message = "Verification token is missing") {
    super(message);
    this.name = "MissingTokenError";
  }
}

export class AlreadyVerifiedError extends Error {
  readonly code = "ALREADY_VERIFIED" as const;

  constructor(message = "Email address has already been verified") {
    super(message);
    this.name = "AlreadyVerifiedError";
  }
}

export class EmailNotVerifiedError extends Error {
  readonly code = "EMAIL_NOT_VERIFIED" as const;
  readonly resendUrl = "POST /api/v1/auth/resend-verification" as const;

  constructor(message = "Email address has not been verified") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}
