-- Migration: 20260313000001_routing_metrics.sql
-- Description: Create routing_metrics table for intelligent AI provider selection

CREATE TABLE IF NOT EXISTS public.routing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    avg_latency NUMERIC NOT NULL DEFAULT 0,
    avg_cost NUMERIC NOT NULL DEFAULT 0,
    risk_score NUMERIC NOT NULL DEFAULT 0,
    reliability_score NUMERIC NOT NULL DEFAULT 100,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(model_name, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routing_metrics_model ON public.routing_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_routing_metrics_provider ON public.routing_metrics(provider);

-- RLS
ALTER TABLE public.routing_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routing metrics"
    ON public.routing_metrics
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System can manage routing metrics"
    ON public.routing_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
