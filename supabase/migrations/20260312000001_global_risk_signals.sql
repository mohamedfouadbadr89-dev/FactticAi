-- Migration: 20260312000001_global_risk_signals.sql
-- Description: Create global_risk_signals table for cross-tenant intelligence

CREATE TYPE public.global_signal_type AS ENUM (
    'hallucination',
    'prompt_injection',
    'policy_bypass',
    'pii_exposure',
    'toxicity',
    'drift_anomaly'
);

CREATE TABLE IF NOT EXISTS public.global_risk_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    signal_type public.global_signal_type NOT NULL,
    risk_score NUMERIC NOT NULL,
    pattern_hash TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for fast aggregation and lookup
CREATE INDEX IF NOT EXISTS idx_global_risk_model ON public.global_risk_signals(model_name);
CREATE INDEX IF NOT EXISTS idx_global_risk_hash ON public.global_risk_signals(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_global_risk_type ON public.global_risk_signals(signal_type);

-- No RLS org filtering here because this is a GLOBAL table. 
-- However, we still enable RLS to define specific access policies.
ALTER TABLE public.global_risk_signals ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view global intelligence
CREATE POLICY "Users can view global risk signals"
    ON public.global_risk_signals
    FOR SELECT
    TO authenticated
    USING (true);

-- Only system/service role can insert/update signals
CREATE POLICY "System can manage global risk signals"
    ON public.global_risk_signals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
