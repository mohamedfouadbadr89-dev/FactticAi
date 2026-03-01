-- PHASE 1: Governance Event Severity Scoring (Minimal Hardening)
-- Objective: Introduce deterministic severity_level derived from total_risk.

-- 1. Database Schema Update
-- We ensure the evaluations table exists (restoring context if missing from migrations)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    interaction_id TEXT NOT NULL,
    total_risk NUMERIC NOT NULL,
    factors JSONB DEFAULT '{}'::jsonb,
    confidence NUMERIC,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add severity_level column
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS severity_level TEXT;

-- Add severity_valid check constraint
ALTER TABLE public.evaluations 
DROP CONSTRAINT IF EXISTS severity_valid;

ALTER TABLE public.evaluations 
ADD CONSTRAINT severity_valid 
CHECK (severity_level IN ('minimal','low','medium','high','critical'));

-- 2. Deterministic Scoring RPC
-- This RPC handles the insertion and deterministic computation of severity.
CREATE OR REPLACE FUNCTION public.score_evaluation(
    p_org_id UUID,
    p_interaction_id TEXT,
    p_total_risk NUMERIC,
    p_factors JSONB,
    p_confidence NUMERIC,
    p_signature TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_severity TEXT;
BEGIN
    -- Harden against search_path injection
    PERFORM set_config('search_path', 'public', false);

    -- Deterministic Severity Matrix (Brief Requirement)
    v_severity := CASE
        WHEN (p_total_risk * 100) >= 80 THEN 'critical'
        WHEN (p_total_risk * 100) >= 60 THEN 'high'
        WHEN (p_total_risk * 100) >= 40 THEN 'medium'
        WHEN (p_total_risk * 100) >= 20 THEN 'low'
        ELSE 'minimal'
    END;

    INSERT INTO public.evaluations (
        org_id, 
        interaction_id, 
        total_risk, 
        factors, 
        confidence, 
        signature, 
        severity_level
    )
    VALUES (
        p_org_id, 
        p_interaction_id, 
        p_total_risk, 
        p_factors, 
        p_confidence, 
        p_signature, 
        v_severity
    );

    -- Audit Log (Institutional Requirement)
    INSERT INTO public.audit_logs (org_id, action, metadata)
    VALUES (
        p_org_id,
        'EVALUATION_SCORED',
        jsonb_build_object(
            'interaction_id', p_interaction_id,
            'severity', v_severity,
            'total_risk', p_total_risk
        )
    );

    RETURN v_severity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Validation
-- Ensure RLS is enabled and policies are set (re-applying for hardening)
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evaluations: Viewable by org members" ON public.evaluations;
CREATE POLICY "Evaluations: Viewable by org members"
ON public.evaluations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = evaluations.org_id
        AND org_members.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Evaluations: Insertable by org members" ON public.evaluations;
CREATE POLICY "Evaluations: Insertable by org members"
ON public.evaluations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = evaluations.org_id
        AND org_members.user_id = auth.uid()
    )
);
