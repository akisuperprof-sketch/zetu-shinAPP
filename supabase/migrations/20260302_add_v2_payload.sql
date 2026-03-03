
-- Migration: Add v2_payload to analyses table
-- Date: 2026-03-02

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS v2_payload JSONB;
