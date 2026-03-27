-- =============================================================================
-- Migration: 019_create_email_verification_tokens.sql
-- Description: Email verification tokens table and email_verified flag on users
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_email_verification_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON email_verification_tokens(user_id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON TABLE email_verification_tokens IS 'Time-limited SHA-256 hashed tokens used to verify user email addresses';
COMMENT ON COLUMN email_verification_tokens.token_hash IS 'SHA-256 hex digest of the raw token sent to the user (64 chars)';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'NULL = unused; set to current timestamp when token is consumed or invalidated';
COMMENT ON COLUMN users.email_verified IS 'True once the user has successfully clicked the verification link';
