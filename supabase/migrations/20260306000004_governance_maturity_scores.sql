-- Migration: Phase 35 Governance Maturity Index
-- Description: Composite telemetry evaluating operational governance posture per organization

CREATE TABLE public.governance_maturity_scores (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    maturity_score numeric not null,
    policy_coverage numeric not null,
    drift_stability numeric not null,
    risk_exposure numeric not null,
    calculated_at timestamp with time zone default now() not null,
    
    -- Absolute Index Range Validation
    CONSTRAINT valid_maturity CHECK (maturity_score >= 0 AND maturity_score <= 100),
    CONSTRAINT valid_coverage CHECK (policy_coverage >= 0 AND policy_coverage <= 100),
    CONSTRAINT valid_stability CHECK (drift_stability >= 0 AND drift_stability <= 100),
    CONSTRAINT valid_risk CHECK (risk_exposure >= 0 AND risk_exposure <= 100)
);

-- Active querying indexes
CREATE INDEX idx_governance_maturity_org_id ON public.governance_maturity_scores(org_id);
CREATE INDEX idx_governance_maturity_calc_time ON public.governance_maturity_scores(calculated_at DESC);

-- RLS Enforcement
ALTER TABLE public.governance_maturity_scores ENABLE ROW LEVEL SECURITY;

-- Orgs can select their own recorded scores
CREATE POLICY "Organizations can read their maturity scores"
    ON public.governance_maturity_scores FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ));

-- Backend explicit writes
CREATE POLICY "Engine can insert maturity evaluations"
    ON public.governance_maturity_scores FOR INSERT
    WITH CHECK (true); -- Bound safely via service execution roles
