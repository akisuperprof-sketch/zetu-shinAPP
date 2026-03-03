-- Migration: Add image quality tracking to analyses table
-- Date: 2026-03-02

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS quality_payload JSONB DEFAULT '{}';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS quality_version TEXT DEFAULT 'v1';

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS img_blur_score REAL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS img_brightness_mean REAL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS img_saturation_mean REAL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS quality_feedback_flag BOOLEAN DEFAULT FALSE;

-- Optional index for faster reporting
CREATE INDEX IF NOT EXISTS idx_analyses_quality_version ON analyses (quality_version);
