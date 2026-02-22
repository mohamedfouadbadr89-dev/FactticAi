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

-- 2. Users Table (Extending Auth.Users if needed, but creating a public reference)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Org Membership Mapping (RBAC)
CREATE TABLE IF NOT EXISTS public.org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

CREATE INDEX idx_org_memberships_user ON public.org_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON public.org_memberships(org_id);

ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

-- 4. Audit Logs (Append-only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Helper function to get the current user's org IDs
CREATE OR REPLACE FUNCTION public.get_auth_orgs()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT org_id 
    FROM public.org_memberships 
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

-- Org Memberships RLS
CREATE POLICY "Users can view memberships of their organizations"
ON public.org_memberships
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Audit Logs RLS
CREATE POLICY "Users can view audit logs of their organizations"
ON public.audit_logs
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true); -- Usually restricted to service_role or specific triggers in real scenarios

-- 6. RPC for Org Resolver (Optional but good practice)
CREATE OR REPLACE FUNCTION public.resolve_org(org_slug TEXT)
RETURNS UUID AS $$
    SELECT id FROM public.organizations WHERE slug = org_slug AND id = ANY(public.get_auth_orgs());
$$ LANGUAGE sql SECURITY DEFINER;
