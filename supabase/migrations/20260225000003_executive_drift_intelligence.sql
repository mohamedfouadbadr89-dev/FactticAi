-- Phase 3: Executive Drift Intelligence
-- Objectives: Implement high-fidelity governance metrics and escalation logic.

-- 1. Executive Health Metrics Table
CREATE TABLE IF NOT EXISTS public.executive_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ghs NUMERIC(5,2) NOT NULL, -- Governance Health Score (0-100)
    dfi NUMERIC(5,4) NOT NULL, -- Drift Frequency Index (0-1)
    rms NUMERIC(5,4) NOT NULL, -- Risk Momentum Signal (-1 to 1)
    avg_risk NUMERIC(5,4) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Drift Alerts Table
CREATE TABLE IF NOT EXISTS public.drift_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'guarded', 'elevated', 'high', 'critical')),
    triggered_by TEXT NOT NULL, -- e.g., 'DFI_BREACH', 'RMS_MOMENTUM', 'CRITICAL_DRIFT'
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.executive_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_alerts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Health Metrics: Viewable by org members"
ON public.executive_health_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = executive_health_metrics.org_id
        AND org_members.user_id = auth.uid()
    )
);

CREATE POLICY "Drift Alerts: Viewable by org members"
ON public.drift_alerts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = drift_alerts.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- 5. Intelligence RPCs
CREATE OR REPLACE FUNCTION public.compute_executive_metrics(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_sessions BIGINT;
    v_drift_sessions BIGINT;
    v_dfi NUMERIC;
    v_avg_risk NUMERIC;
    v_ghs NUMERIC;
    v_rms NUMERIC;
    v_prev_risk NUMERIC;
BEGIN
    -- 1. DFI Calculation (Lookback 100 snapshots)
    SELECT COUNT(*), COUNT(*) FILTER (WHERE drift_detected = TRUE)
    INTO v_total_sessions, v_drift_sessions
    FROM (
        SELECT drift_detected 
        FROM public.governance_snapshots 
        WHERE org_id = p_org_id 
        ORDER BY created_at DESC 
        LIMIT 100
    ) s;

    v_dfi := CASE WHEN v_total_sessions > 0 THEN v_drift_sessions::NUMERIC / v_total_sessions ELSE 0 END;

    -- 2. Avg Risk Calculation
    SELECT COALESCE(AVG(total_risk), 0)
    INTO v_avg_risk
    FROM public.sessions
    WHERE org_id = p_org_id AND status = 'completed';

    -- 3. GHS Calculation
    v_ghs := 100 * (1 - v_avg_risk) * (1 - v_dfi);

    -- 4. RMS Calculation (Momentum over last 10 sessions vs previous 10)
    SELECT AVG(total_risk) INTO v_prev_risk
    FROM (
        SELECT total_risk 
        FROM public.sessions 
        WHERE org_id = p_org_id AND status = 'completed'
        ORDER BY ended_at DESC 
        LIMIT 10 OFFSET 10
    ) p;

    v_rms := CASE WHEN v_prev_risk > 0 THEN (v_avg_risk - v_prev_risk) / v_prev_risk ELSE 0 END;

    -- 5. Persist Metric Snapshot
    INSERT INTO public.executive_health_metrics (org_id, ghs, dfi, rms, avg_risk)
    VALUES (p_org_id, v_ghs, v_dfi, v_rms, v_avg_risk);

    RETURN jsonb_build_object(
        'ghs', ROUND(v_ghs, 2),
        'dfi', v_dfi,
        'rms', v_rms,
        'avg_risk', v_avg_risk
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.evaluate_alert_escalation(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ghs NUMERIC;
    v_rms NUMERIC;
    v_dfi NUMERIC;
BEGIN
    -- Fetch latest metrics
    SELECT ghs, rms, dfi INTO v_ghs, v_rms, v_dfi
    FROM public.executive_health_metrics
    WHERE org_id = p_org_id
    ORDER BY collected_at DESC
    LIMIT 1;

    -- 1. DFI Breach Alert
    IF v_dfi > 0.3 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'high', 'DFI_BREACH', 'Institutional drift frequency exceeded 30% threshold.');
    END IF;

    -- 2. Momentum Breach Alert
    IF v_rms > 0.2 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'elevated', 'RMS_MOMENTUM', 'Risk momentum accelerating rapidly (>20%).');
    END IF;

    -- 3. Critical Health Alert
    IF v_ghs < 60 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        VALUES (p_org_id, 'critical', 'LOW_GHS', 'Governance Health Score dropped below critical threshold (60).');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
