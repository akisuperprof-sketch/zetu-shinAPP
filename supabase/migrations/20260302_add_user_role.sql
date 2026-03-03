
-- Migration: Add user_role to analyses table for segmentation
-- Date: 2026-03-02

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'FREE';

-- Update existing records if any
UPDATE analyses SET user_role = 'PRO_PERSONAL' WHERE v2_payload->>'output_version' LIKE '%pro%';
