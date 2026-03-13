-- Migration: 20260311000001_runtime_intercepts.sql
-- Description: Create runtime_intercepts table for active governance control

CREATE TABLE IF NOT EXISTS public.runtime_intercepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    action TEXT NOT NULL CHECK (action IN ('allow','warn','block','rewrite','escalate')),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runtime_intercepts_org ON public.runtime_intercepts(org_id);
CREATE INDEX IF NOT EXISTS idx_runtime_intercepts_session ON public.runtime_intercepts(session_id);
CREATE INDEX IF NOT EXISTS idx_runtime_intercepts_action ON public.runtime_intercepts(action);
CREATE INDEX IF NOT EXISTS idx_runtime_intercepts_created ON public.runtime_intercepts(created_at DESC);

-- RLS
ALTER TABLE public.runtime_intercepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view intercepts from their org"
    ON public.runtime_intercepts
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert intercepts"
    ON public.runtime_intercepts
    FOR INSERT
    WITH CHECK (true);
