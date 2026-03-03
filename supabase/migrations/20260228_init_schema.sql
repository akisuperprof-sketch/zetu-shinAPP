
-- Z-26 Supabase Initial Schema (Final Version)

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    raw_response JSONB,
    request_parts JSONB
);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) to perform all operations
-- Based on the project ref: gborhvtkbjiirofgplle
CREATE POLICY "Allow service role access" ON analyses
    FOR ALL
    USING (true)
    WITH CHECK (true);
