-- Migration: Add missing columns and views for Research Dashboard v1.4
-- Path: supabase/migrations/20260308013000_research_dashboard_views.sql

-- 1. Add missing columns to tongue_observations
ALTER TABLE public.tongue_observations 
ADD COLUMN IF NOT EXISTS processing_mode TEXT DEFAULT 'off';

-- 2. Add missing columns to analyses (if any, but metadata is in answers_json)

-- 3. Create or Replace Views

-- View: research_dashboard (Recent Uploads)
CREATE OR REPLACE VIEW public.research_dashboard AS
SELECT 
    id,
    created_at as created_at_utc,
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') as created_at_jst,
    processing_mode,
    segmentation_status,
    quality_score,
    processed_path,
    mask_path
FROM public.tongue_observations;

-- View: research_daily_summary (Daily Target)
CREATE OR REPLACE VIEW public.research_daily_summary AS
SELECT 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date::text as target_date_jst,
    count(*) as upload_count
FROM public.tongue_observations
GROUP BY (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date
ORDER BY (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date DESC;

-- View: research_quality_summary (Quality Stats)
CREATE OR REPLACE VIEW public.research_quality_summary AS
SELECT 
    id,
    quality_score,
    quality_flags,
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') as created_at_jst
FROM public.tongue_observations
WHERE segmentation_status = 'completed';

-- 4. Enable RLS or satisfy safety requirements
-- (Views inherit permissions usually, but we ensure service role can read them)
GRANT SELECT ON public.research_dashboard TO service_role;
GRANT SELECT ON public.research_daily_summary TO service_role;
GRANT SELECT ON public.research_quality_summary TO service_role;
