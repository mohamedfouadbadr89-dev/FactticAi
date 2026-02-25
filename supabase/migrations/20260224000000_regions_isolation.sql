-- Migration: Add Region Isolation (v1.1)
-- Description: Adds region_id to organizations for residency-based isolation.

ALTER TABLE public.organizations ADD COLUMN region_id text;

-- Backfill existing orgs with default region
UPDATE public.organizations SET region_id = 'us-east-1' WHERE region_id IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE public.organizations ALTER COLUMN region_id SET NOT NULL;

-- Index for performance in isolation checks
CREATE INDEX idx_organizations_region_id ON public.organizations(region_id);
