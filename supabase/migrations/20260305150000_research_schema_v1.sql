-- Create new schema for ZETUSHIN Research DB v1.0
-- Based on docs/research_min_schema.md

-- 1. tongue_observations (観測記録)
CREATE TABLE IF NOT EXISTS public.tongue_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_id UUID NOT NULL,
    image_ref TEXT NOT NULL,
    age_range TEXT,
    gender TEXT,
    chief_complaint TEXT,
    consent_version TEXT NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    schema_version TEXT NOT NULL DEFAULT 'v1.0'
);

-- Index for anon_id
CREATE INDEX IF NOT EXISTS idx_tongue_obs_anon_id ON public.tongue_observations(anon_id);

-- 2. research_events (研究イベントログ)
-- Drop old table if necessary or keep it. User wants new schema.
-- Let's check if research_events exists.
CREATE TABLE IF NOT EXISTS public.research_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for anon_id on events
CREATE INDEX IF NOT EXISTS idx_research_events_anon_id ON public.research_events(anon_id);

-- 3. analyses (解析結果)
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_id UUID NOT NULL,
    observation_id UUID NOT NULL REFERENCES public.tongue_observations(id) ON DELETE CASCADE,
    answers_json JSONB NOT NULL,
    questionnaire_version TEXT NOT NULL,
    scores_json JSONB,
    pattern_ids TEXT[],
    analysis_mode TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    schema_version TEXT NOT NULL DEFAULT 'v1.0'
);

-- Index for anon_id on analyses
CREATE INDEX IF NOT EXISTS idx_analyses_anon_id ON public.analyses(anon_id);

-- Enable RLS (憲法に従い、最小アクセスのみ)
ALTER TABLE public.tongue_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Basic policy: allow anonymous insert (if token is valid) or service role only
-- Since we are calling from Edge Functions with service role, we might not need public write policies.
-- But for Direct client-side calls if any:
-- CREATE POLICY "Enable insert for all" ON public.research_events FOR INSERT WITH CHECK (true);
-- To be safe and follow constitution, we use Edge Functions + Service Role.
