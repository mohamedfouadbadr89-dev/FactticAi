-- Phase 2: User Management & RBAC Formalization
-- Description: Transition to institutional roles (admin, analyst, viewer) and harden user profiles.

-- 1. Update ORG_MEMBERS check constraint for new roles
ALTER TABLE public.org_members
DROP CONSTRAINT IF EXISTS org_members_role_check;

ALTER TABLE public.org_members
ADD CONSTRAINT org_members_role_check 
CHECK (role IN ('admin', 'analyst', 'viewer', 'owner'));

-- 2. Migrate existing 'member' role to 'analyst'
UPDATE public.org_members
SET role = 'analyst'
WHERE role = 'member';

-- 3. Create User Profiles Table (if not exists)
-- FactticAI uses public.users for basic data, but profiles handles extended institutional metadata.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    job_title TEXT,
    department TEXT,
    bio TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles in their org"
ON public.profiles
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Indices
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(org_id);
