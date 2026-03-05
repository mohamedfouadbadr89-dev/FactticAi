-- Migration: 20260316000001_predictive_drift_events.sql
-- Create predictive_drift_events table for early-warning signals

CREATE TABLE IF NOT EXISTS public.predictive_drift_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    drift_score FLOAT DEFAULT 0,
    risk_momentum FLOAT DEFAULT 0,
    predicted_threshold_hours INTEGER,
    status TEXT CHECK (status IN ('watch', 'warning', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_predictive_drift_org ON public.predictive_drift_events(org_id);
CREATE INDEX IF NOT EXISTS idx_predictive_drift_model ON public.predictive_drift_events(model_name);
CREATE INDEX IF NOT EXISTS idx_predictive_drift_created ON public.predictive_drift_events(created_at);

-- Comment for system tracking
COMMENT ON TABLE public.predictive_drift_events IS 'Stores early-warning signals for model performance degradation and risk momentum.';
