ALTER TABLE public.governance_predictions
ADD COLUMN IF NOT EXISTS system_mode TEXT NOT NULL DEFAULT 'bootstrap'
CHECK (system_mode IN ('bootstrap', 'operational'));

ALTER TABLE public.governance_predictions
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

    SELECT COUNT(*) INTO v_total_sessions 
    FROM public.sessions 
    WHERE org_id = p_org_id AND status = 'completed';

    SELECT COUNT(*) INTO v_snapshot_count
    FROM public.governance_snapshots
    WHERE org_id = p_org_id;

    SELECT COUNT(*) FILTER (WHERE drift_detected = TRUE)
    INTO v_drift_sessions
    FROM (
        SELECT drift_detected 
        FROM public.governance_snapshots 
        WHERE org_id = p_org_id 
        ORDER BY created_at DESC 
        LIMIT 100
    ) s;

    v_dfi := CASE WHEN v_snapshot_count > 0 THEN v_drift_sessions::NUMERIC / LEAST(v_snapshot_count, 100) ELSE 0 END;

    SELECT COALESCE(AVG(total_risk), 0) INTO v_avg_risk
    FROM public.sessions
    WHERE org_id = p_org_id AND status = 'completed';

    IF v_total_sessions < 20 OR v_snapshot_count < 30 THEN
        v_system_mode := 'bootstrap';
        v_rms := NULL;
        v_prev_risk := NULL;
    ELSE
        v_system_mode := 'operational';
        SELECT AVG(total_risk) INTO v_prev_risk
        FROM (
            SELECT total_risk 
            FROM public.sessions 
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

    v_ghs := 100 * (1 - v_avg_risk) * (1 - v_dfi);
    v_ghs := GREATEST(0, LEAST(100, v_ghs));

    INSERT INTO public.governance_predictions (
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
        COALESCE(v_prev_risk, 0),
        v_avg_risk,
        v_dfi,
        v_ghs,
        v_system_mode,
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

CREATE OR REPLACE FUNCTION public.evaluate_alert_escalation(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ghs NUMERIC;
    v_rms NUMERIC;
    v_dfi NUMERIC;
    v_system_mode TEXT;
BEGIN
    PERFORM set_config('search_path', 'public', true);

    SELECT risk_index, (metadata->>'rms')::NUMERIC, drift_score, system_mode 
    INTO v_ghs, v_rms, v_dfi, v_system_mode
    FROM public.governance_predictions
    WHERE org_id = p_org_id AND metric_type = 'executive_health'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_system_mode = 'bootstrap' OR v_system_mode IS NULL THEN
        RETURN;
    END IF;

    IF v_dfi > 0.3 AND NOT EXISTS (
        SELECT 1 FROM public.drift_alerts 
        WHERE org_id = p_org_id AND triggered_by = 'DFI_BREACH' AND status = 'active'
    ) THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'high', 'DFI_BREACH', 'Institutional drift frequency exceeded 30% threshold.');
    END IF;

    IF v_rms > 0.2 AND NOT EXISTS (
        SELECT 1 FROM public.drift_alerts 
        WHERE org_id = p_org_id AND triggered_by = 'RMS_MOMENTUM' AND status = 'active'
    ) THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'elevated', 'RMS_MOMENTUM', 'Risk momentum accelerating rapidly (>20%).');
    END IF;

    IF v_ghs < 60 AND NOT EXISTS (
        SELECT 1 FROM public.drift_alerts 
        WHERE org_id = p_org_id AND triggered_by = 'LOW_GHS' AND status = 'active'
    ) THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'critical', 'LOW_GHS', 'Governance Health Score dropped below critical threshold (60).');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
