-- Migration: Add research_events table for Research Mode
-- Path: supabase/migrations/20260303_add_research_events.sql

CREATE TABLE IF NOT EXISTS research_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    anonymous_user_id TEXT NOT NULL,
    top1_id TEXT,
    level INTEGER,
    current_type_label TEXT,
    is_dummy BOOLEAN DEFAULT false,
    app_version TEXT,
    output_version TEXT,
    age_range TEXT,
    payload JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE research_events ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) access
-- Note: We use the same pattern as analyses table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'research_events' AND policyname = 'Allow service role access'
    ) THEN
        CREATE POLICY "Allow service role access" ON research_events
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
