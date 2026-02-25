-- Tier 2: Institutional Access Hardening (v3.2)
-- Description: Adds enterprise SSO configuration and VPC metadata.

-- 1. Extend Organizations for SSO
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sso_enforced BOOLEAN DEFAULT FALSE;

-- 2. SSO Configuration Table
CREATE TABLE IF NOT EXISTS public.sso_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oidc')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id)
);

-- Enable RLS
ALTER TABLE public.sso_configs ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view SSO config for their organization"
ON public.sso_configs
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Indices
CREATE INDEX idx_sso_configs_org ON public.sso_configs(org_id);
