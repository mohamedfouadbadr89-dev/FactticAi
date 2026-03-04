-- Migration: Phase 39 AI Governance Benchmark Engine
-- Stores computed benchmark scores per model per org for cross-comparison

CREATE TABLE public.governance_benchmarks (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    model_name text not null,
    reliability_score numeric(5,2) not null default 0 CHECK (reliability_score BETWEEN 0 AND 100),
    safety_score numeric(5,2) not null default 0 CHECK (safety_score BETWEEN 0 AND 100),
    hallucination_rate numeric(5,2) not null default 0 CHECK (hallucination_rate BETWEEN 0 AND 100),
    policy_adherence numeric(5,2) not null default 0 CHECK (policy_adherence BETWEEN 0 AND 100),
    calculated_at timestamp with time zone default now() not null
);

CREATE INDEX idx_governance_benchmarks_org_id ON public.governance_benchmarks(org_id);
CREATE INDEX idx_governance_benchmarks_calculated_at ON public.governance_benchmarks(calculated_at DESC);

ALTER TABLE public.governance_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own benchmarks"
    ON public.governance_benchmarks FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert benchmark records"
    ON public.governance_benchmarks FOR INSERT
    WITH CHECK (true);
