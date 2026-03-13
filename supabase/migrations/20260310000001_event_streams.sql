-- Migration: Phase 43 OpenTelemetry Event Streaming
-- Append-only ledger of all governance events published to external observability systems

CREATE TABLE public.event_streams (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}',
    created_at timestamp with time zone default now() not null,

    CONSTRAINT valid_event_type CHECK (event_type IN (
        'guardrail.trigger',
        'incident.response',
        'interceptor.block',
        'interceptor.escalate',
        'interceptor.warn',
        'interceptor.allow',
        'policy.violation',
        'testing.run',
        'benchmark.computed',
        'deployment.config_changed',
        'custom'
    ))
);

CREATE INDEX idx_event_streams_org_id     ON public.event_streams(org_id);
CREATE INDEX idx_event_streams_event_type ON public.event_streams(event_type);
CREATE INDEX idx_event_streams_created_at ON public.event_streams(created_at DESC);

ALTER TABLE public.event_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own event streams"
    ON public.event_streams FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert event streams"
    ON public.event_streams FOR INSERT
    WITH CHECK (true);
