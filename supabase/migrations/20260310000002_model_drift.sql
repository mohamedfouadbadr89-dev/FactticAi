-- Migration: Phase 44 Model Drift Monitoring
-- Records periodic drift metric snapshots per model and org

CREATE TABLE public.model_drift_metrics (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    model_name text not null,
    hallucination_rate numeric(5,2) not null default 0 CHECK (hallucination_rate BETWEEN 0 AND 100),
    policy_violation_rate numeric(5,2) not null default 0 CHECK (policy_violation_rate BETWEEN 0 AND 100),
    confidence_drop numeric(5,2) not null default 0 CHECK (confidence_drop BETWEEN 0 AND 100),
    drift_score numeric(5,2) not null default 0 CHECK (drift_score BETWEEN 0 AND 100),
    recorded_at timestamp with time zone default now() not null
);

CREATE INDEX idx_model_drift_org_id     ON public.model_drift_metrics(org_id);
CREATE INDEX idx_model_drift_model_name ON public.model_drift_metrics(model_name);
CREATE INDEX idx_model_drift_recorded_at ON public.model_drift_metrics(recorded_at DESC);

ALTER TABLE public.model_drift_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own drift metrics"
    ON public.model_drift_metrics FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert drift metrics"
    ON public.model_drift_metrics FOR INSERT
    WITH CHECK (true);
