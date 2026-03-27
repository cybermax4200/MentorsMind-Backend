-- =============================================================================
-- Migration: 018_create_file_uploads.sql
-- Description: File uploads metadata table for the file upload service
-- =============================================================================

CREATE TABLE IF NOT EXISTS file_uploads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key      TEXT        NOT NULL UNIQUE,
  original_name TEXT        NOT NULL,
  mime_type     TEXT        NOT NULL,
  size_bytes    INTEGER     NOT NULL,
  uploader_id   UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  cdn_url       TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_file_key ON file_uploads(file_key);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploader ON file_uploads(uploader_id);

COMMENT ON TABLE file_uploads IS 'Metadata for all uploaded files (avatars, documents, attachments)';
COMMENT ON COLUMN file_uploads.file_key IS 'Unique server-generated identifier for the stored file';
COMMENT ON COLUMN file_uploads.cdn_url IS 'Publicly accessible CDN URL pointing to the stored file';
