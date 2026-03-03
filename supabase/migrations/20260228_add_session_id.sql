
-- Migration to add session_id
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS session_id TEXT;
