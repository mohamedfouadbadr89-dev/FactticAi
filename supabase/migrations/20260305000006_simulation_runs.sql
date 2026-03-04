-- Migration: Phase 32 AI Governance Simulator
-- Creates the simulation_runs table logging deterministic risk injections.

CREATE TABLE IF NOT EXISTS public.simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL CHECK (scenario IN ('hallucination_injection', 'pii_extraction', 'tone_shift', 'safety_override')),
    risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    intercepted BOOLEAN NOT NULL DEFAULT false,
    intercept_reason TEXT,
    run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for querying simulation performance historically
CREATE INDEX IF NOT EXISTS idx_simulation_runs_org_id ON public.simulation_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_scenario ON public.simulation_runs(scenario);

-- Enable RLS
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

-- Strict Immutable RLS Policies
CREATE POLICY "Org members can read their simulation runs"
    ON public.simulation_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = simulation_runs.org_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Org Admins can execute simulation runs"
    ON public.simulation_runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = simulation_runs.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );
