-- Phase 1C: Engine Formal Closure
-- Objective: Add deterministic hash column and update the aggregation RPC.

-- 1. Add Column
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS deterministic_hash TEXT;

-- 2. Update RPC to include hashing
CREATE OR REPLACE FUNCTION public.compute_session_aggregate(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_risk NUMERIC;
    v_org_id UUID;
    v_new_hash TEXT;
BEGIN
    -- Resolve org_id for safety
    SELECT org_id INTO v_org_id FROM public.sessions WHERE id = p_session_id;
    
    -- Calculate weighted aggregate from turns
    SELECT COALESCE(SUM(incremental_risk), 0)
    INTO v_total_risk
    FROM public.session_turns
    WHERE session_id = p_session_id;

    -- Generate Deterministic Hash (v1)
    -- SHA256(session_id + total_risk + org_id)
    -- In production, this would include turn content hashes for full forensics
    SELECT encode(digest(p_session_id::text || v_total_risk::text || v_org_id::text, 'sha256'), 'hex')
    INTO v_new_hash;

    -- Update session state
    UPDATE public.sessions
    SET 
        total_risk = LEAST(v_total_risk, 1.0),
        deterministic_hash = v_new_hash,
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Log aggregation event
    INSERT INTO public.audit_logs (org_id, action, metadata)
    VALUES (
        v_org_id,
        'COMPUTE_SESSION_AGGREGATE',
        jsonb_build_object(
            'session_id', p_session_id,
            'aggregated_risk', LEAST(v_total_risk, 1.0),
            'deterministic_hash', v_new_hash
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
