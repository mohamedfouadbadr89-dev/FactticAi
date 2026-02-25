ALTER TABLE public.governance_predictions
ADD COLUMN IF NOT EXISTS system_mode TEXT NOT NULL DEFAULT 'bootstrap'
CHECK (system_mode IN ('bootstrap', 'operational')),
ADD COLUMN IF NOT EXISTS completed_sessions_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.compute_executive_metrics(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_sessions BIGINT;
    v_drift_sessions BIGINT;
    v_snapshot_count BIGINT;
    v_dfi NUMERIC;
    v_avg_risk NUMERIC;
    v_ghs NUMERIC;
    v_rms NUMERIC;
    v_prev_risk NUMERIC;
    v_system_mode TEXT;
BEGIN
    PERFORM set_config('search_path', 'public', true);

    -- 1. Count Requirements
    SELECT COUNT(*) INTO v_total_sessions 
    FROM sessions 
    WHERE org_id = p_org_id AND status = 'completed';

    SELECT COUNT(*) INTO v_snapshot_count
    FROM governance_snapshots
    WHERE org_id = p_org_id;

    -- 2. DFI Calculation (Lookback 100 snapshots)
    SELECT COUNT(*) FILTER (WHERE drift_detected = TRUE)
    INTO v_drift_sessions
    FROM (
        SELECT drift_detected 
        FROM governance_snapshots 
        WHERE org_id = p_org_id 
        ORDER BY created_at DESC 
        LIMIT 100
    ) s;

    v_dfi := CASE WHEN v_snapshot_count > 0 THEN v_drift_sessions::NUMERIC / LEAST(v_snapshot_count, 100) ELSE 0 END;

    -- 3. Avg Risk Calculation
    SELECT COALESCE(AVG(total_risk), 0) INTO v_avg_risk
    FROM sessions
    WHERE org_id = p_org_id AND status = 'completed';

    -- 4. Bootstrap Logic
    IF v_total_sessions < 20 OR v_snapshot_count < 30 THEN
        v_system_mode := 'bootstrap';
        v_rms := NULL;
        v_prev_risk := NULL;
    ELSE
        v_system_mode := 'operational';
        
        -- RMS Calculation (Derivative vs trailing window)
        SELECT AVG(total_risk) INTO v_prev_risk
        FROM (
            SELECT total_risk 
            FROM sessions 
            WHERE org_id = p_org_id AND status = 'completed'
            ORDER BY ended_at DESC 
            LIMIT 10 OFFSET 10
        ) p;
        
        v_rms := CASE 
            WHEN v_prev_risk IS NOT NULL AND v_prev_risk > 0
            THEN (v_avg_risk - v_prev_risk) / v_prev_risk
            ELSE 0
        END;
    END IF;

    -- 5. Clamped GHS Calculation
    v_ghs := 100 * (1 - v_avg_risk) * (1 - v_dfi);
    v_ghs := GREATEST(0, LEAST(100, v_ghs));

    -- 6. Persist into governance_predictions
    INSERT INTO governance_predictions (
        org_id, 
        metric_type, 
        baseline_value, 
        current_value, 
        drift_score, 
        risk_index, 
        horizon, 
        system_mode,
        completed_sessions_count,
        metadata
    )
    VALUES (
        p_org_id, 
        'executive_health', 
        COALESCE(v_prev_risk, 0), -- baseline
        v_avg_risk, -- current
        v_dfi, -- drift_score
        v_ghs, -- risk_index
        v_system_mode, -- horizon mapping
        v_system_mode,
        v_total_sessions,
        jsonb_build_object(
            'rms', v_rms,
            'snapshots_count', v_snapshot_count
        )
    );

    RETURN jsonb_build_object(
        'ghs', ROUND(v_ghs, 2),
        'dfi', v_dfi,
        'rms', v_rms,
        'system_mode', v_system_mode,
        'sessions_count', v_total_sessions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
