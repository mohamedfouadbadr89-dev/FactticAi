-- Migration: Phase 47 Cost Intelligence Layer
-- Tracks token usage, cost in USD, and associated risk per model per org

CREATE TABLE public.cost_metrics (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    model_name text not null,
    token_usage numeric(12,0) not null default 0 CHECK (token_usage >= 0),
    cost_usd numeric(10,6) not null default 0 CHECK (cost_usd >= 0),
    risk_score numeric(5,2) not null default 0 CHECK (risk_score BETWEEN 0 AND 100),
    session_id text,
    created_at timestamp with time zone default now() not null
);

CREATE INDEX idx_cost_metrics_org_id     ON public.cost_metrics(org_id);
CREATE INDEX idx_cost_metrics_model_name ON public.cost_metrics(model_name);
CREATE INDEX idx_cost_metrics_created_at ON public.cost_metrics(created_at DESC);

ALTER TABLE public.cost_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own cost metrics"
    ON public.cost_metrics FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert cost metrics"
    ON public.cost_metrics FOR INSERT
    WITH CHECK (true);
