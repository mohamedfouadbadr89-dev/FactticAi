-- Migration: Phase 33 AI Behavior Forensics Engine
-- Description: Deep behavioral signal telemetry mapping intent drift and boundary violations

CREATE TABLE public.behavior_forensics (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    session_id uuid not null references public.sessions(id) on delete cascade,
    signal_type text not null,
    signal_score numeric not null,
    created_at timestamp with time zone default now() not null,
    CONSTRAINT valid_signal_type CHECK (signal_type IN (
        'intent_drift', 
        'context_overflow', 
        'instruction_override', 
        'prompt_violation'
    ))
);

-- Indexes for active telemetry
CREATE INDEX idx_behavior_forensics_org_id ON public.behavior_forensics(org_id);
CREATE INDEX idx_behavior_forensics_session_id ON public.behavior_forensics(session_id);
CREATE INDEX idx_behavior_forensics_created_at ON public.behavior_forensics(created_at);

-- Enable RLS
ALTER TABLE public.behavior_forensics ENABLE ROW LEVEL SECURITY;

-- Policies: Orgs can insert signals and read their own org's forensics
CREATE POLICY "Orgs can read their own behavior forensics"
    ON public.behavior_forensics FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert behavior forensics"
    ON public.behavior_forensics FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ));
