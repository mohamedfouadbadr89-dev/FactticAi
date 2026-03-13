-- Migration: 20260311000004_behavior_dataset.sql
-- Description: Create model_behavior table for long-term behavioral tracking

CREATE TABLE IF NOT EXISTS public.model_behavior (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    hallucination_rate NUMERIC DEFAULT 0,
    policy_violations NUMERIC DEFAULT 0,
    risk_score NUMERIC DEFAULT 0,
    response_length NUMERIC DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_behavior_model ON public.model_behavior(model_name);
CREATE INDEX IF NOT EXISTS idx_model_behavior_org ON public.model_behavior(org_id);
CREATE INDEX IF NOT EXISTS idx_model_behavior_ts ON public.model_behavior(timestamp);

-- RLS
ALTER TABLE public.model_behavior ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view model behavior for their org"
    ON public.model_behavior
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert model behavior"
    ON public.model_behavior
    FOR INSERT
    WITH CHECK (true);
