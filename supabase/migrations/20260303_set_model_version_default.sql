-- Migration: Set Model Version Default and Update Scoring RPC
-- Date: 2026-03-03
-- Objective: Ensure model_version_id defaults to the institutional baseline v1.0.

-- 1. Update Evaluations Table Default
ALTER TABLE public.evaluations 
ALTER COLUMN model_version_id SET DEFAULT 'b9032ed0-f781-489d-9452-b176e8e4c9f1'::uuid;

-- 2. Update score_evaluation RPC to handle model_version_id
-- We first drop the old version to avoid overloading conflicts.
DROP FUNCTION IF EXISTS public.score_evaluation(UUID, TEXT, NUMERIC, JSONB, NUMERIC, TEXT);

-- We add p_model_version_id as an optional parameter to maintain backward compatibility
-- with current calls while allowing future precision.
CREATE OR REPLACE FUNCTION public.score_evaluation(
    p_org_id UUID,
    p_interaction_id TEXT,
    p_total_risk NUMERIC,
    p_factors JSONB,
    p_confidence NUMERIC,
    p_signature TEXT,
    p_model_version_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_severity TEXT;
    v_model_version UUID;
BEGIN
    -- Harden against search_path injection
    PERFORM set_config('search_path', 'public', false);

    -- Use provided model version or default to baseline v1.0
    v_model_version := COALESCE(p_model_version_id, 'b9032ed0-f781-489d-9452-b176e8e4c9f1'::uuid);

    -- Deterministic Severity Matrix
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
        severity_level,
        model_version_id
    )
    VALUES (
        p_org_id, 
        p_interaction_id, 
        p_total_risk, 
        p_factors, 
        p_confidence, 
        p_signature, 
        v_severity,
        v_model_version
    );

    -- Audit Log (Institutional Requirement)
    INSERT INTO public.audit_logs (org_id, action, metadata)
    VALUES (
        p_org_id,
        'EVALUATION_SCORED',
        jsonb_build_object(
            'interaction_id', p_interaction_id,
            'severity', v_severity,
            'total_risk', p_total_risk,
            'model_version_id', v_model_version
        )
    );

    RETURN v_severity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
