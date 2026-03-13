-- Migration: Phase 38 Voice AI Integrations Layer
-- Stores external provider credentials and connection status per org

CREATE TABLE public.external_integrations (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    provider text not null,
    api_key text,
    webhook_secret text,
    status text not null default 'inactive',
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    CONSTRAINT valid_provider CHECK (provider IN (
        'vapi', 'retell', 'elevenlabs', 'openai_realtime', 'anthropic_agents'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error')),
    -- One integration config per provider per org
    UNIQUE (org_id, provider)
);

CREATE INDEX idx_external_integrations_org_id ON public.external_integrations(org_id);

-- RLS: per-org isolation
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own integrations"
    ON public.external_integrations FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Organizations can upsert their own integrations"
    ON public.external_integrations FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Organizations can update their own integrations"
    ON public.external_integrations FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));
