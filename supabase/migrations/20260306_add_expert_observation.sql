-- Migration: Add expert_observation to analyses table
-- Date: 2026-03-06

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS expert_observation JSONB;
