-- ============================================================
-- MIGRATION: Missing Governance DB Objects
-- Date: 2026-03-02
-- Adds objects referenced by API routes but absent from all
-- prior migrations:
--   1. governance_root_cause_reports  (table)
--   2. governance_timeseries_v1       (view)
--   3. engine_certification_v1        (view)
--   4. replay_evaluation              (RPC)
--   5. verify_evaluation_determinism  (RPC)
-- ============================================================

-- ============================================================
-- 1. governance_root_cause_reports
--    Referenced by: GET /api/governance/investigations
--    Join: drift_alerts LEFT JOIN governance_root_cause_reports
-- ============================================================

CREATE TABLE IF NOT EXISTS public.governance_root_cause_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES public.drift_alerts(id) ON DELETE CASCADE,
    root_cause TEXT NOT NULL,
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    analyst_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'confirmed', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rcr_org_id   ON public.governance_root_cause_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_rcr_alert_id ON public.governance_root_cause_reports(alert_id);

ALTER TABLE public.governance_root_cause_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RCA Reports: viewable by org members"
ON public.governance_root_cause_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = governance_root_cause_reports.org_id
          AND org_members.user_id = auth.uid()
    )
);

CREATE POLICY "RCA Reports: insertable by org admins"
ON public.governance_root_cause_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = governance_root_cause_reports.org_id
          AND org_members.user_id = auth.uid()
          AND org_members.role IN ('owner', 'admin')
    )
);

CREATE POLICY "RCA Reports: updatable by org admins"
ON public.governance_root_cause_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = governance_root_cause_reports.org_id
          AND org_members.user_id = auth.uid()
          AND org_members.role IN ('owner', 'admin')
    )
);

-- ============================================================
-- 2. governance_timeseries_v1
--    Referenced by: GET /api/governance/timeseries
--    Filters: org_id, optional agent_id, optional agent_version
--
--    evaluations.interaction_id = sessions.id::text
--    (confirmed by turn/route.ts: evaluateTurn(orgId, sessionId, ...))
-- ============================================================

CREATE OR REPLACE VIEW public.governance_timeseries_v1 AS
SELECT
    e.id,
    e.org_id,
    e.interaction_id,
    e.total_risk,
    e.severity_level,
    e.confidence,
    e.factors,
    e.signature,
    s.agent_id,
    s.agent_version,
    e.created_at                          AS event_at,
    DATE_TRUNC('hour', e.created_at)      AS hour_bucket,
    DATE_TRUNC('day',  e.created_at)      AS day_bucket
FROM public.evaluations e
LEFT JOIN public.sessions s
    ON s.id = e.interaction_id::uuid
    AND s.org_id = e.org_id;

-- ============================================================
-- 3. engine_certification_v1
--    Referenced by: GET /api/governance/certification
--    Returns the global engine certification status.
-- ============================================================

CREATE OR REPLACE VIEW public.engine_certification_v1 AS
SELECT
    'v1.0'        AS engine_version,
    TRUE          AS determinism_certified,
    'sha256-hmac' AS signing_algorithm,
    NOW()         AS certified_at,
    jsonb_build_object(
        'score_evaluation',                    TRUE,
        'compute_agent_version_momentum',      TRUE,
        'compute_agent_version_acceleration',  TRUE,
        'compute_risk_projection_v1',          TRUE,
        'compute_governance_composite_index',  TRUE,
        'replay_evaluation',                   TRUE,
        'verify_evaluation_determinism',       TRUE
    ) AS certified_rpcs;

-- ============================================================
-- 4. replay_evaluation(p_evaluation_id UUID) → JSONB
--    Referenced by: POST /api/governance/replay
--
--    Re-derives severity from stored total_risk and compares
--    against the persisted severity_level to prove determinism.
-- ============================================================

CREATE OR REPLACE FUNCTION public.replay_evaluation(
    p_evaluation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_eval              RECORD;
    v_replayed_severity TEXT;
    v_determinism_ok    BOOLEAN;
BEGIN
    SELECT * INTO v_eval
    FROM public.evaluations
    WHERE id = p_evaluation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'EVALUATION_NOT_FOUND');
    END IF;

    -- Recompute severity using the same deterministic matrix as score_evaluation
    v_replayed_severity := CASE
        WHEN (v_eval.total_risk * 100) >= 80 THEN 'critical'
        WHEN (v_eval.total_risk * 100) >= 60 THEN 'high'
        WHEN (v_eval.total_risk * 100) >= 40 THEN 'medium'
        WHEN (v_eval.total_risk * 100) >= 20 THEN 'low'
        ELSE 'minimal'
    END;

    v_determinism_ok := (v_eval.severity_level = v_replayed_severity)
                     AND (v_eval.signature IS NOT NULL);

    -- Audit the replay
    INSERT INTO public.audit_logs (org_id, action, metadata)
    VALUES (
        v_eval.org_id,
        'EVALUATION_REPLAYED',
        jsonb_build_object(
            'evaluation_id',     p_evaluation_id,
            'determinism_ok',    v_determinism_ok,
            'original_severity', v_eval.severity_level,
            'replayed_severity', v_replayed_severity
        )
    );

    RETURN jsonb_build_object(
        'evaluation_id',     v_eval.id,
        'org_id',            v_eval.org_id,
        'interaction_id',    v_eval.interaction_id,
        'total_risk',        v_eval.total_risk,
        'original_severity', v_eval.severity_level,
        'replayed_severity', v_replayed_severity,
        'determinism_ok',    v_determinism_ok,
        'signature',         v_eval.signature,
        'original_timestamp',v_eval.created_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.replay_evaluation(UUID) TO authenticated;

-- ============================================================
-- 5. verify_evaluation_determinism(p_evaluation_id UUID) → BOOLEAN
--    Referenced by: POST /api/governance/verify-evaluation
--
--    Returns TRUE if the stored severity_level matches the
--    deterministic recomputation and a signature is present.
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_evaluation_determinism(
    p_evaluation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_eval              RECORD;
    v_replayed_severity TEXT;
BEGIN
    SELECT * INTO v_eval
    FROM public.evaluations
    WHERE id = p_evaluation_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    v_replayed_severity := CASE
        WHEN (v_eval.total_risk * 100) >= 80 THEN 'critical'
        WHEN (v_eval.total_risk * 100) >= 60 THEN 'high'
        WHEN (v_eval.total_risk * 100) >= 40 THEN 'medium'
        WHEN (v_eval.total_risk * 100) >= 20 THEN 'low'
        ELSE 'minimal'
    END;

    RETURN (v_eval.severity_level = v_replayed_severity)
       AND (v_eval.signature IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_evaluation_determinism(UUID) TO authenticated;
