-- =========================================================
-- PHASE 3B – HARD ALERT ENFORCEMENT LAYER (INSTITUTIONAL)
-- Deterministic escalation + cooldown + duplicate prevention
-- =========================================================

-- ---------------------------------------------------------
-- 1) Escalation Log Table
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.governance_escalation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    metric_snapshot_id UUID NOT NULL REFERENCES public.governance_predictions(id) ON DELETE CASCADE,
    previous_severity TEXT,
    new_severity TEXT NOT NULL,
    escalation_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_escalation_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Governance Escalation Log: Viewable by org members'
    ) THEN
        CREATE POLICY "Governance Escalation Log: Viewable by org members"
        ON public.governance_escalation_log
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1
                FROM public.org_members
                WHERE org_members.org_id = governance_escalation_log.org_id
                AND org_members.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- ---------------------------------------------------------
-- 2) Unique Active Alert Constraint
-- Prevent duplicate active alerts per org + trigger source
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_drift_alerts_unique_active_org_trigger'
    ) THEN
        CREATE UNIQUE INDEX idx_drift_alerts_unique_active_org_trigger
        ON public.drift_alerts (org_id, triggered_by)
        WHERE status = 'active';
    END IF;
END $$;

-- ---------------------------------------------------------
-- 3) Enforcement Function
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_governance_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ghs NUMERIC;
    v_dfi NUMERIC;
    v_rms NUMERIC := 0;
    v_system_mode TEXT;

    v_new_severity TEXT;
    v_previous_severity TEXT;

    v_cooldown_interval INTERVAL;
    v_last_alert_time TIMESTAMPTZ;
BEGIN
    -- Lock search path
    PERFORM set_config('search_path', 'public', true);

    v_ghs := NEW.risk_index;
    v_dfi := NEW.drift_score;
    v_system_mode := NEW.system_mode;

    -- Safe RMS extraction (no cast failure)
    IF NEW.metadata ? 'rms' THEN
        v_rms := COALESCE((NEW.metadata->>'rms')::NUMERIC, 0);
    END IF;

    -- Ignore bootstrap mode
    IF v_system_mode IS NULL OR v_system_mode = 'bootstrap' THEN
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------
    -- Deterministic Escalation Matrix
    -- -----------------------------------------------------

    IF v_ghs < 40 THEN
        v_new_severity := 'systemic';
    ELSIF v_ghs < 50 OR v_dfi > 0.5 THEN
        v_new_severity := 'critical';
    ELSIF v_dfi > 0.3 OR v_rms > 0.4 THEN
        v_new_severity := 'high';
    ELSE
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------
    -- Cooldown Rules
    -- -----------------------------------------------------

    v_cooldown_interval := CASE
        WHEN v_new_severity = 'systemic' THEN interval '48 hours'
        WHEN v_new_severity = 'critical' THEN interval '24 hours'
        WHEN v_new_severity = 'high' THEN interval '12 hours'
        ELSE interval '6 hours'
    END;

    SELECT MAX(created_at)
    INTO v_last_alert_time
    FROM public.drift_alerts
    WHERE org_id = NEW.org_id
    AND triggered_by = 'GOVERNANCE_INTELLIGENCE'
    AND created_at > now() - v_cooldown_interval;

    IF v_last_alert_time IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------
    -- Get previous active severity (if exists)
    -- -----------------------------------------------------

    SELECT severity
    INTO v_previous_severity
    FROM public.drift_alerts
    WHERE org_id = NEW.org_id
    AND triggered_by = 'GOVERNANCE_INTELLIGENCE'
    AND status = 'active'
    LIMIT 1;

    -- -----------------------------------------------------
    -- Insert Alert (duplicate prevented by unique index)
    -- -----------------------------------------------------

    INSERT INTO public.drift_alerts (
        org_id,
        severity,
        triggered_by,
        description,
        status
    )
    VALUES (
        NEW.org_id,
        v_new_severity,
        'GOVERNANCE_INTELLIGENCE',
        'Deterministic breach: GHS=' || v_ghs ||
        ', DFI=' || v_dfi ||
        ', RMS=' || v_rms,
        'active'
    )
    ON CONFLICT DO NOTHING;

    -- -----------------------------------------------------
    -- Escalation Log
    -- -----------------------------------------------------

    INSERT INTO public.governance_escalation_log (
        org_id,
        metric_snapshot_id,
        previous_severity,
        new_severity,
        escalation_reason
    )
    VALUES (
        NEW.org_id,
        NEW.id,
        v_previous_severity,
        v_new_severity,
        'Matrix breach: GHS(' || v_ghs || ') / DFI(' || v_dfi || ')'
    );

    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------
-- 4) Trigger
-- ---------------------------------------------------------

DROP TRIGGER IF EXISTS trg_enforce_governance_alerts
ON public.governance_predictions;

CREATE TRIGGER trg_enforce_governance_alerts
AFTER INSERT ON public.governance_predictions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_governance_alerts();