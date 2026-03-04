-- Migration: 20260304_cross_session_intelligence.sql
-- Create Cross-Session Intelligence Tables

CREATE TABLE IF NOT EXISTS public.cross_session_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL,
    pattern_signature TEXT NOT NULL,
    pattern_confidence NUMERIC(4,3) DEFAULT 0,
    occurrence_count INTEGER DEFAULT 0,
    risk_weight NUMERIC(4,3) DEFAULT 0,
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, pattern_signature)
);

CREATE INDEX IF NOT EXISTS idx_cross_session_patterns_org_id ON public.cross_session_patterns(org_id);
CREATE INDEX IF NOT EXISTS idx_cross_session_patterns_type ON public.cross_session_patterns(pattern_type);

-- RLS Enforcement
ALTER TABLE public.cross_session_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's patterns"
    ON public.cross_session_patterns
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service Role can manage patterns"
    ON public.cross_session_patterns
    FOR ALL
    USING (current_user = 'service_role');
