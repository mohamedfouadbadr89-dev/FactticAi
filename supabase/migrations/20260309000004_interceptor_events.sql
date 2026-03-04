-- Migration: Phase 41 Real-Time Governance Interceptor
-- Append-only event log for all interceptor decisions

CREATE TABLE public.interceptor_events (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    session_id text not null,
    action text not null,
    reason text,
    risk_score numeric(5,2) not null default 0 CHECK (risk_score BETWEEN 0 AND 100),
    created_at timestamp with time zone default now() not null,

    CONSTRAINT valid_action CHECK (action IN ('ALLOW', 'WARN', 'BLOCK', 'ESCALATE'))
);

CREATE INDEX idx_interceptor_events_org_id ON public.interceptor_events(org_id);
CREATE INDEX idx_interceptor_events_session_id ON public.interceptor_events(session_id);
CREATE INDEX idx_interceptor_events_created_at ON public.interceptor_events(created_at DESC);
CREATE INDEX idx_interceptor_events_action ON public.interceptor_events(action);

ALTER TABLE public.interceptor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own interceptor events"
    ON public.interceptor_events FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert interceptor events"
    ON public.interceptor_events FOR INSERT
    WITH CHECK (true);
