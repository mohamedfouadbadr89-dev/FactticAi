-- Migration: Phase 42 Enterprise Deployment Layer
-- Stores per-org deployment mode configuration

CREATE TABLE public.deployment_configs (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    mode text not null default 'SAAS',
    region text not null default 'us-east-1',
    data_residency text not null default 'US',
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    CONSTRAINT valid_mode CHECK (mode IN ('SAAS', 'VPC', 'SELF_HOSTED')),
    CONSTRAINT valid_data_residency CHECK (data_residency IN ('US', 'EU', 'APAC', 'CUSTOM')),
    -- One config record per org
    UNIQUE (org_id)
);

CREATE INDEX idx_deployment_configs_org_id ON public.deployment_configs(org_id);

ALTER TABLE public.deployment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own deployment config"
    ON public.deployment_configs FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can upsert their own deployment config"
    ON public.deployment_configs FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can update their own deployment config"
    ON public.deployment_configs FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));
