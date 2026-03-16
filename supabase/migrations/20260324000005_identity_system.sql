-- Migration: Enterprise Identity and Organization System
-- Description: Creates organizations, users, and memberships to enforce multi-tenant enterprise RBAC.

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, org_id)
);

-- Constraints
ALTER TABLE public.memberships ADD CONSTRAINT chk_role CHECK (role IN ('owner', 'admin', 'analyst', 'viewer'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON public.memberships(org_id);

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_organizations" ON public.organizations AS PERMISSIVE FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_users" ON public.users AS PERMISSIVE FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_memberships" ON public.memberships AS PERMISSIVE FOR ALL USING (auth.role() = 'service_role');
