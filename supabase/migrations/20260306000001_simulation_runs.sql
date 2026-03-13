-- Migration: Phase 32 AI Governance Simulator telemetry
-- Description: Immutable execution records logging simulator outcomes

CREATE TABLE public.simulation_runs (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    scenario text not null,
    risk_score numeric not null,
    blocked boolean not null,
    run_timestamp timestamp with time zone default now() not null
);

-- Indexes
CREATE INDEX idx_simulation_runs_org_id ON public.simulation_runs(org_id);
CREATE INDEX idx_simulation_runs_run_timestamp ON public.simulation_runs(run_timestamp);

-- Enable RLS
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

-- Policies: Analysts can insert simulation payload logs and read their own org's simulations
CREATE POLICY "Orgs can read their own simulations"
    ON public.simulation_runs FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Analysts can run and insert simulations"
    ON public.simulation_runs FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'analyst')
    ));
