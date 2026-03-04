-- Migration: Phase 40 Automatic Governance Testing Lab
-- Stores individual governance stress test run results

CREATE TABLE public.testing_runs (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    agent_name text not null,
    scenario text not null,
    risk_score numeric(5,2) not null default 0 CHECK (risk_score BETWEEN 0 AND 100),
    result text not null default 'pending',
    created_at timestamp with time zone default now() not null,

    CONSTRAINT valid_scenario CHECK (scenario IN (
        'hallucination_stress',
        'policy_violation_test',
        'prompt_injection_test',
        'context_overflow_test'
    )),
    CONSTRAINT valid_result CHECK (result IN ('pending', 'passed', 'failed', 'blocked'))
);

CREATE INDEX idx_testing_runs_org_id ON public.testing_runs(org_id);
CREATE INDEX idx_testing_runs_created_at ON public.testing_runs(created_at DESC);

ALTER TABLE public.testing_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own testing runs"
    ON public.testing_runs FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert testing runs"
    ON public.testing_runs FOR INSERT
    WITH CHECK (true);
