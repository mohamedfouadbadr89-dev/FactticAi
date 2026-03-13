-- Migration: Phase 36 Autonomous Incident Response Engine
-- Description: Persist automatic governance incident events and their executed responses

CREATE TABLE public.incident_responses (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    incident_type text not null,
    trigger_source text not null,
    action_taken text not null,
    resolved boolean default false not null,
    created_at timestamp with time zone default now() not null,

    CONSTRAINT valid_incident_type CHECK (incident_type IN (
        'drift_alert',
        'guardrail_block',
        'policy_violation',
        'forensics_signal'
    )),
    CONSTRAINT valid_action_taken CHECK (action_taken IN (
        'alert_security_team',
        'block_agent',
        'escalate_investigation',
        'lock_session'
    ))
);

-- Efficient querying
CREATE INDEX idx_incident_responses_org_id ON public.incident_responses(org_id);
CREATE INDEX idx_incident_responses_resolved ON public.incident_responses(resolved);
CREATE INDEX idx_incident_responses_created_at ON public.incident_responses(created_at DESC);

-- RLS
ALTER TABLE public.incident_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own incidents"
    ON public.incident_responses FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Organizations can update their incident resolution status"
    ON public.incident_responses FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM public.org_members
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert incident records"
    ON public.incident_responses FOR INSERT
    WITH CHECK (true);
