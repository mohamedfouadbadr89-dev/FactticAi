-- Migration: 20260304000001_silent_regression_intelligence.sql
-- Create Silent Regression Signals Table

CREATE TABLE IF NOT EXISTS public.regression_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    baseline_value NUMERIC(6,4) NOT NULL DEFAULT 0,
    current_value NUMERIC(6,4) NOT NULL DEFAULT 0,
    delta NUMERIC(6,4) NOT NULL DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'low' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, model_version, signal_type, detected_at)
);

CREATE INDEX IF NOT EXISTS idx_regression_signals_org ON public.regression_signals(org_id);
CREATE INDEX IF NOT EXISTS idx_regression_signals_model ON public.regression_signals(model_version);

-- RLS Enforcement
ALTER TABLE public.regression_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org regression signals"
    ON public.regression_signals
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service Role can manage regression signals"
    ON public.regression_signals
    FOR ALL
    USING (current_user = 'service_role');
