-- Level 1: Core Infrastructure Migration
-- Description: Establishes organizations, users, memberships, and audit logs with RLS.

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Org Membership Mapping (Unified naming: org_members)
CREATE TABLE IF NOT EXISTS public.org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

CREATE INDEX idx_org_members_user ON public.org_members(user_id);
CREATE INDEX idx_org_members_org ON public.org_members(org_id);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 4. Audit Logs (Append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Aligned naming
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Webhook Events (Missing Table Restored)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider, idempotency_key)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 6. Helper Functions & Policies

-- Helper function to get the current user's org IDs
CREATE OR REPLACE FUNCTION public.get_auth_orgs()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT org_id 
    FROM public.org_members 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS
CREATE POLICY "Users can view their own organizations"
ON public.organizations
FOR SELECT
USING (id = ANY(public.get_auth_orgs()));

-- Users RLS
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Org Members RLS
CREATE POLICY "Users can view memberships of their organizations"
ON public.org_members
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Audit Logs RLS
CREATE POLICY "Users can view audit logs of their organizations"
ON public.audit_logs
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Webhook Events RLS
CREATE POLICY "Users can view webhook events of their organizations"
ON public.webhook_events
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- RPC for Org Resolver
CREATE OR REPLACE FUNCTION public.resolve_org(p_user_id UUID)
RETURNS TABLE (org_id UUID, role TEXT) AS $$
    SELECT org_id, role 
    FROM public.org_members 
    WHERE user_id = p_user_id 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
