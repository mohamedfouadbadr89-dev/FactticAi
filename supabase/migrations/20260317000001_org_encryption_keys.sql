-- Migration: 20260317000001_org_encryption_keys.sql
-- Create org_encryption_keys table for BYOK management

CREATE TABLE IF NOT EXISTS public.org_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    key_reference TEXT NOT NULL,
    key_provider TEXT NOT NULL CHECK (key_provider IN ('aws_kms', 'vault', 'local')),
    key_status TEXT NOT NULL CHECK (key_status IN ('active', 'rotated', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_org_keys_org_id ON public.org_encryption_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_org_keys_status ON public.org_encryption_keys(key_status);

-- RLS Policies
ALTER TABLE public.org_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access to all keys"
    ON public.org_encryption_keys
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment for system tracking
COMMENT ON TABLE public.org_encryption_keys IS 'Stores references to encryption keys for organization-specific data sovereignty (BYOK).';
