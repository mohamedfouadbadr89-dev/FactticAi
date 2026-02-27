-- ==========================================
-- PHASE 4 — PREDICTIVE GOVERNANCE ENGINE
-- ==========================================

CREATE OR REPLACE FUNCTION public.compute_risk_projection(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recent_avg NUMERIC := 0;
    v_prev_avg NUMERIC := 0;
    v_trend NUMERIC := 0;
    v_projection_14d NUMERIC := 0;
    v_projection_30d NUMERIC := 0;
BEGIN

    -- Last 14 sessions average risk
    SELECT COALESCE(AVG(total_risk),0)
    INTO v_recent_avg
    FROM (
        SELECT total_risk
        FROM public.sessions
        WHERE org_id = p_org_id
        AND status = 'completed'
        ORDER BY ended_at DESC
        LIMIT 14
    ) s;

    -- Previous 14 sessions
    SELECT COALESCE(AVG(total_risk),0)
    INTO v_prev_avg
    FROM (
        SELECT total_risk
        FROM public.sessions
        WHERE org_id = p_org_id
        AND status = 'completed'
        ORDER BY ended_at DESC
        LIMIT 14 OFFSET 14
    ) p;

    IF v_prev_avg > 0 THEN
        v_trend := (v_recent_avg - v_prev_avg) / v_prev_avg;
    END IF;

    -- Normalize trend
    v_trend := LEAST(GREATEST(v_trend, -1), 1);

    -- Linear projection
    v_projection_14d := LEAST(GREATEST(v_recent_avg * (1 + v_trend),0),1);
    v_projection_30d := LEAST(GREATEST(v_recent_avg * (1 + (v_trend * 2)),0),1);

    RETURN jsonb_build_object(
        'current_avg', ROUND(v_recent_avg,4),
        'trend', ROUND(v_trend,4),
        'projection_14d', ROUND(v_projection_14d,4),
        'projection_30d', ROUND(v_projection_30d,4)
    );

END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_risk_projection(UUID)
TO authenticated;