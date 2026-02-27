-- ==========================================
-- PHASE 3 — EXECUTIVE DRIFT INTELLIGENCE
-- Hardened Version
-- ==========================================

-- 1️⃣ Executive Health Metrics Table

CREATE TABLE IF NOT EXISTS public.executive_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ghs NUMERIC(5,2) NOT NULL CHECK (ghs BETWEEN 0 AND 100),
    dfi NUMERIC(5,4) NOT NULL CHECK (dfi BETWEEN 0 AND 1),
    rms NUMERIC(6,4) NOT NULL CHECK (rms BETWEEN -1 AND 1),
    avg_risk NUMERIC(5,4) NOT NULL CHECK (avg_risk BETWEEN 0 AND 1),
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2️⃣ Drift Alerts Table

CREATE TABLE IF NOT EXISTS public.drift_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('low','guarded','elevated','high','critical')),
    triggered_by TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3️⃣ Enable RLS

ALTER TABLE public.executive_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_alerts ENABLE ROW LEVEL SECURITY;

-- 4️⃣ RLS Policies (SELECT only)

CREATE POLICY "Health Metrics: org select"
ON public.executive_health_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = executive_health_metrics.org_id
        AND org_members.user_id = auth.uid()
    )
);

CREATE POLICY "Drift Alerts: org select"
ON public.drift_alerts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = drift_alerts.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- 5️⃣ Executive Metrics Engine (Normalized + Hardened)

CREATE OR REPLACE FUNCTION public.compute_executive_metrics(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total BIGINT;
    v_drift BIGINT;
    v_dfi NUMERIC := 0;
    v_avg_risk NUMERIC := 0;
    v_ghs NUMERIC := 0;
    v_rms NUMERIC := 0;
    v_prev_risk NUMERIC := 0;
BEGIN

    -- Drift Frequency (last 100 snapshots)
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE drift_detected = TRUE)
    INTO v_total, v_drift
    FROM (
        SELECT drift_detected
        FROM public.governance_snapshots
        WHERE org_id = p_org_id
        ORDER BY created_at DESC
        LIMIT 100
    ) s;

    IF v_total > 0 THEN
        v_dfi := v_drift::NUMERIC / v_total;
    END IF;

    -- Normalize DFI
    v_dfi := LEAST(GREATEST(v_dfi, 0), 1);

    -- Average Risk
    SELECT COALESCE(AVG(total_risk), 0)
    INTO v_avg_risk
    FROM public.sessions
    WHERE org_id = p_org_id
    AND status = 'completed';

    v_avg_risk := LEAST(GREATEST(v_avg_risk, 0), 1);

    -- Governance Health Score
    v_ghs := 100 * (1 - v_avg_risk) * (1 - v_dfi);
    v_ghs := LEAST(GREATEST(v_ghs, 0), 100);

    -- Risk Momentum (10 vs previous 10)
    SELECT AVG(total_risk)
    INTO v_prev_risk
    FROM (
        SELECT total_risk
        FROM public.sessions
        WHERE org_id = p_org_id
        AND status = 'completed'
        ORDER BY ended_at DESC
        LIMIT 10 OFFSET 10
    ) p;

    IF v_prev_risk IS NOT NULL AND v_prev_risk > 0 THEN
        v_rms := (v_avg_risk - v_prev_risk) / v_prev_risk;
    END IF;

    v_rms := LEAST(GREATEST(v_rms, -1), 1);

    -- Persist snapshot
    INSERT INTO public.executive_health_metrics (org_id, ghs, dfi, rms, avg_risk)
    VALUES (p_org_id, v_ghs, v_dfi, v_rms, v_avg_risk);

    RETURN jsonb_build_object(
        'ghs', ROUND(v_ghs, 2),
        'dfi', ROUND(v_dfi, 4),
        'rms', ROUND(v_rms, 4),
        'avg_risk', ROUND(v_avg_risk, 4)
    );
END;
$$;

-- 6️⃣ Alert Escalation (No duplicate active alerts)

CREATE OR REPLACE FUNCTION public.evaluate_alert_escalation(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ghs NUMERIC;
    v_rms NUMERIC;
    v_dfi NUMERIC;
BEGIN

    SELECT ghs, rms, dfi
    INTO v_ghs, v_rms, v_dfi
    FROM public.executive_health_metrics
    WHERE org_id = p_org_id
    ORDER BY collected_at DESC
    LIMIT 1;

    IF v_dfi > 0.3 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        SELECT p_org_id, 'high', 'DFI_BREACH',
               'Institutional drift frequency exceeded 30% threshold.'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.drift_alerts
            WHERE org_id = p_org_id
            AND triggered_by = 'DFI_BREACH'
            AND status = 'active'
        );
    END IF;

    IF v_rms > 0.2 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        SELECT p_org_id, 'elevated', 'RMS_MOMENTUM',
               'Risk momentum accelerating rapidly (>20%).'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.drift_alerts
            WHERE org_id = p_org_id
            AND triggered_by = 'RMS_MOMENTUM'
            AND status = 'active'
        );
    END IF;

    IF v_ghs < 60 THEN
        INSERT INTO public.drift_alerts (org_id, severity, triggered_by, description)
        SELECT p_org_id, 'critical', 'LOW_GHS',
               'Governance Health Score dropped below critical threshold.'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.drift_alerts
            WHERE org_id = p_org_id
            AND triggered_by = 'LOW_GHS'
            AND status = 'active'
        );
    END IF;

END;
$$;