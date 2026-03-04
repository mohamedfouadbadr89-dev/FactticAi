-- Migration: 20260315000001_ai_health_scores.sql
-- Description: Create ai_health_scores table for v1 product overview

CREATE TABLE IF NOT EXISTS public.ai_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    health_score NUMERIC NOT NULL DEFAULT 100,
    risk_level TEXT NOT NULL DEFAULT 'low',
    blocked_responses INTEGER DEFAULT 0,
    drift_alerts INTEGER DEFAULT 0,
    agent_incidents INTEGER DEFAULT 0,
    cost_efficiency NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_risk_level CHECK (risk_level IN ('low', 'moderate', 'high', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_health_scores_org ON public.ai_health_scores(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_health_scores_created ON public.ai_health_scores(created_at);

-- RLS
ALTER TABLE public.ai_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's health scores"
    ON public.ai_health_scores FOR SELECT
    TO authenticated
    USING (org_id IN (SELECT id FROM public.organizations));

CREATE POLICY "System can manage health scores"
    ON public.ai_health_scores FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
