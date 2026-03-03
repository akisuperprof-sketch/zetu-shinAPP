
-- Migration: Add doctor_review table for validation
-- Date: 2026-03-02

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('draft', 'submitted', 'locked');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS doctor_review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    doctor_pattern_def_id TEXT NOT NULL,
    doctor_confidence INT CHECK (doctor_confidence >= 0 AND doctor_confidence <= 100),
    doctor_comment TEXT,
    reviewer_id_hash TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT now(),
    review_status review_status DEFAULT 'draft'
);

-- Index for performance on summary reports
CREATE INDEX IF NOT EXISTS idx_dr_analysis_id ON doctor_review(analysis_id);
