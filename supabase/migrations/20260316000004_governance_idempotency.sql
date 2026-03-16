-- =============================================================================
-- Migration: 20260316000004_governance_idempotency.sql
-- Phase: Tamper-Evident Ledger — Idempotency Protection
-- =============================================================================

-- 1) Extend ledger schema
ALTER TABLE public.facttic_governance_events
ADD COLUMN IF NOT EXISTS queue_job_id TEXT;

-- 2) Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_governance_job_id
ON public.facttic_governance_events(queue_job_id);

-- 3) Modify append_governance_ledger RPC
CREATE OR REPLACE FUNCTION public.append_governance_ledger(
    p_session_id      UUID,
    p_org_id          UUID,
    p_event_type      TEXT    DEFAULT 'governance_decision',
    p_prompt          TEXT    DEFAULT NULL,
    p_model           TEXT    DEFAULT 'unspecified',
    p_decision        TEXT    DEFAULT 'ALLOW',
    p_risk_score      NUMERIC DEFAULT 0,
    p_violations_str  TEXT    DEFAULT '[]',
    p_violations      JSONB   DEFAULT '[]',
    p_guardrail_signals JSONB DEFAULT '{}',
    p_latency         NUMERIC DEFAULT 0,
    p_model_response  TEXT    DEFAULT NULL,
    p_secret          TEXT    DEFAULT 'development_fallback_secret',
    p_queue_job_id    TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id       UUID    := gen_random_uuid();
    v_now            TIMESTAMPTZ := now();
    -- Unix epoch milliseconds — used by timeline queries (Number(row.timestamp))
    v_ts_ms          BIGINT  := EXTRACT(EPOCH FROM v_now)::BIGINT * 1000;
    v_previous_hash  TEXT;
    v_hash_input     TEXT;
    v_event_hash     TEXT;
    v_signature      TEXT;
    v_result         JSONB;
BEGIN

    -- ── Idempotency Check ───────────────────────────────────────────────────
    IF p_queue_job_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'event_id',      id,
            'session_id',    session_id,
            'event_hash',    event_hash,
            'previous_hash', previous_hash,
            'signature',     signature,
            'created_at',    created_at
        ) INTO v_result
        FROM public.facttic_governance_events
        WHERE queue_job_id = p_queue_job_id;

        IF FOUND THEN
            RETURN v_result;
        END IF;
    END IF;

    -- ── 0) Acquire per-session advisory transaction lock ─────────────────────
    PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));

    -- ── a) Fetch previous hash (atomic — inside this function call) ──────────
    v_previous_hash := public.get_latest_event_hash(p_session_id);

    -- ── b) Build deterministic hash input ───────────────────────────────────
    v_hash_input :=
        p_session_id::TEXT      ||   -- session_id
        v_ts_ms::TEXT           ||   -- timestamp (ms epoch)
        COALESCE(p_prompt, '')  ||   -- prompt
        p_decision              ||   -- decision
        p_risk_score::TEXT      ||   -- risk_score
        p_violations_str        ||   -- JSON stringified violations
        v_previous_hash;             -- previous_hash (chain link)

    -- ── c) Compute SHA-256 event hash via pgcrypto ──────────────────────────
    v_event_hash := encode(
        digest(v_hash_input, 'sha256'),
        'hex'
    );

    -- ── d) Compute HMAC-SHA256 signature (org-secret bound) ─────────────────
    v_signature := encode(
        hmac(v_event_hash, p_secret, 'sha256'),
        'hex'
    );

    -- ── e) Atomic INSERT with all hash fields populated ──────────────────────
    INSERT INTO public.facttic_governance_events (
        id,
        session_id,
        org_id,
        event_type,
        prompt,
        model,
        decision,
        risk_score,
        violations,
        guardrail_signals,
        latency,
        timestamp,
        created_at,
        previous_hash,
        event_hash,
        signature,
        metadata,
        queue_job_id
    ) VALUES (
        v_event_id,
        p_session_id,
        p_org_id,
        p_event_type,
        p_prompt,
        p_model,
        p_decision,
        p_risk_score,
        p_violations,
        p_guardrail_signals,
        p_latency,
        v_ts_ms,
        v_now,
        v_previous_hash,
        v_event_hash,
        v_signature,
        CASE WHEN p_model_response IS NOT NULL
             THEN jsonb_build_object('model_response', p_model_response)
             ELSE NULL
        END,
        p_queue_job_id
    );

    -- ── f) Return the full forensic record to the caller ────────────────────
    v_result := jsonb_build_object(
        'event_id',      v_event_id,
        'session_id',    p_session_id,
        'event_hash',    v_event_hash,
        'previous_hash', v_previous_hash,
        'signature',     v_signature,
        'created_at',    v_now
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '[append_governance_ledger] Insert failed for session % org %: %',
        p_session_id, p_org_id, SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.append_governance_ledger(UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, JSONB, JSONB, NUMERIC, TEXT, TEXT, TEXT) IS
    'Atomic hash-chain append for facttic_governance_events. Idempotently checks queue_job_id to prevent duplicates.';
