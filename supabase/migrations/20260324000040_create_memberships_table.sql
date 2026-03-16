-- Migration: Create Memberships Table
-- Description: Creates the enterprise RBAC memberships table for Facttic identity layer.

CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    org_id uuid REFERENCES public.organizations(id),
    role text CHECK (role IN ('owner','admin','analyst','viewer')),
    created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user
ON public.memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_org
ON public.memberships(org_id);
