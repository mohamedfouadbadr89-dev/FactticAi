-- Phase 3: Session Aggregation RPC
-- Objective: Eliminates frontend recalculation by persisting deterministic aggregates.

-- 1. RPC Implementation
CREATE OR REPLACE FUNCTION public.compute_session_aggregate(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_risk NUMERIC;
    v_org_id UUID;
BEGIN
    -- Resolve org_id for safety
    SELECT org_id INTO v_org_id FROM public.sessions WHERE id = p_session_id;
    
    -- Calculate weighted aggregate from turns
    -- We use the sum of incremental_risk capped at 1.0 for high-fidelity auditing.
    SELECT COALESCE(SUM(incremental_risk), 0)
    INTO v_total_risk
    FROM public.session_turns
    WHERE session_id = p_session_id;

    -- Update session state
    UPDATE public.sessions
    SET 
        total_risk = LEAST(v_total_risk, 1.0),
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Log aggregation event
    INSERT INTO public.audit_logs (org_id, action, metadata)
    VALUES (
        v_org_id,
        NULL, -- actor_id is NULL for system-triggered aggregation
        'COMPUTE_SESSION_AGGREGATE',
        jsonb_build_object(
            'session_id', p_session_id,
            'aggregated_risk', LEAST(v_total_risk, 1.0)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
