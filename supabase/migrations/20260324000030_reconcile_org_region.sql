-- Migration: Reconcile Organizations Region ID
-- Description: Fixes organizations table to ensure region_id has a default and is NOT NULL to prevent insert failures.

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS region_id text;

ALTER TABLE public.organizations 
ALTER COLUMN region_id SET DEFAULT 'global';

UPDATE public.organizations 
SET region_id = 'global' 
WHERE region_id IS NULL;

ALTER TABLE public.organizations 
ALTER COLUMN region_id SET NOT NULL;
