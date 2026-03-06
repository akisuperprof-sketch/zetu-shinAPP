-- Add preprocessing fields to tongue_observations table
ALTER TABLE public.tongue_observations 
ADD COLUMN IF NOT EXISTS original_path TEXT,
ADD COLUMN IF NOT EXISTS processed_path TEXT,
ADD COLUMN IF NOT EXISTS mask_path TEXT,
ADD COLUMN IF NOT EXISTS segmentation_status TEXT,
ADD COLUMN IF NOT EXISTS segmentation_method TEXT,
ADD COLUMN IF NOT EXISTS quality_score NUMERIC,
ADD COLUMN IF NOT EXISTS quality_flags JSONB,
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Update image_ref to be optional or used as alias for original_path if needed
-- For now, we will use it for compatibility or keep it.
