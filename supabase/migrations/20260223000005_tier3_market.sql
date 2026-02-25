-- Tier 3: Market Activation (v3.3)
-- Description: Adds a metadata column for pilot tracking and enterprise configurations.

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure indices for common metadata queries if needed
CREATE INDEX IF NOT EXISTS idx_organizations_metadata ON public.organizations USING gin (metadata);
