-- Migration: 20260324000001_org_encryption_keys.sql
-- Description: Create org_encryption_keys table for BYOK management

CREATE TABLE IF NOT EXISTS public.org_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  key_fingerprint TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.org_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view their keys
CREATE POLICY "Org members can view their keys"
ON public.org_encryption_keys FOR SELECT
USING (org_id IN (
  SELECT org_id FROM public.org_members 
  WHERE user_id = auth.uid()
));

-- Grant access to service role for backend processing
GRANT ALL ON public.org_encryption_keys TO service_role;
