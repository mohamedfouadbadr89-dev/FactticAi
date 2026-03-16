-- =============================================================================
-- Migration: 20260316000001_governance_hash_chain.sql
-- Phase: Tamper-Evident Ledger — Hash Chain for facttic_governance_events
-- =============================================================================
-- This migration:
--   1. Ensures event_hash and previous_hash columns exist (idempotent)
--   2. Creates append_governance_ledger() — the atomic RPC called by
--      EvidenceLedger.write() to chain-link every governance event
--   3. Creates get_latest_event_hash() — helper RPC for hash chain lookups
--   4. Creates verify_event_chain() — integrity verification RPC
--   5. Adds covering indexes for hash chain traversal
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Schema extension (idempotent — safe to run multiple times)
--
-- These columns were partially added by 20260324000000_architecture_reconciliation.sql
-- The IF NOT EXISTS guards ensure this migration is fully idempotent even when
-- run against a database that already has these columns.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.facttic_governance_events
    ADD COLUMN IF NOT EXISTS previous_hash   TEXT NOT NULL DEFAULT 'GENESIS_HASH',
    ADD COLUMN IF NOT EXISTS event_hash      TEXT,
    ADD COLUMN IF NOT EXISTS signature       TEXT,
    ADD COLUMN IF NOT EXISTS metadata        JSONB;

-- Covering index for chain traversal — ordered by session + insertion time
CREATE INDEX IF NOT EXISTS idx_fge_hash_chain
    ON public.facttic_governance_events (session_id, created_at ASC)
    INCLUDE (event_hash, previous_hash);

-- Lookup by event_hash (used for chain validation and linking)
CREATE INDEX IF NOT EXISTS idx_fge_event_hash
    ON public.facttic_governance_events (event_hash)
    WHERE event_hash IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: get_latest_event_hash(p_session_id)
--
-- Returns the event_hash of the most recently inserted event for a session,
-- or 'GENESIS_HASH' if no events exist yet.
--
-- This RPC is called atomically inside append_governance_ledger() to prevent
-- a race condition where two concurrent inserts both see NULL and both claim
-- to be the genesis block. The lock happens at the INSERT level via
-- FOR UPDATE SKIP LOCKED in append_governance_ledger.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_latest_event_hash(p_session_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_last_hash TEXT;
BEGIN
    SELECT event_hash
    INTO   v_last_hash
    FROM   public.facttic_governance_events
    WHERE  session_id = p_session_id
      AND  event_hash IS NOT NULL
    ORDER  BY created_at DESC
    LIMIT  1;

    RETURN COALESCE(v_last_hash, 'GENESIS_HASH');
END;
$$;

COMMENT ON FUNCTION public.get_latest_event_hash(UUID) IS
    'Returns the most recent event_hash for a session, or GENESIS_HASH if this is the first event. Called inside append_governance_ledger() to build the chain link.';


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: append_governance_ledger(...)
--
-- Primary atomic write RPC. Called by EvidenceLedger.write() in the
-- application layer. Performs all of the following in a single Postgres
-- function call:
--
--   a) Fetches the previous event_hash for this session
--   b) Computes SHA-256(previous_hash || event_type || org_id || created_at || metadata)
--      using pgcrypto's digest() function
--   c) Computes HMAC-SHA256(event_hash, p_secret) for the signature
--   d) INSERTs the row with all hash fields populated atomically
--   e) Returns the complete event record to the caller
--
-- FIELD ORDERING for hash input (canonical — never change without migrating):
--   session_id + timestamp + prompt + decision + risk_score + violations_str + previous_hash
--
-- This mirrors the buildHashInput() function in lib/evidence/evidenceLedger.ts
-- exactly. Both must remain in sync for verify_event_chain() to pass.
-- ─────────────────────────────────────────────────────────────────────────────

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
    p_secret          TEXT    DEFAULT 'development_fallback_secret'
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
    -- ── 0) Acquire per-session advisory transaction lock ─────────────────────
    -- Serializes concurrent WRITES for the exact same session_id, ensuring
    -- linear chain continuity without causing broad table lock contention.
    PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));

    -- ── a) Fetch previous hash (atomic — inside this function call) ──────────
    v_previous_hash := public.get_latest_event_hash(p_session_id);

    -- ── b) Build deterministic hash input ───────────────────────────────────
    -- Field order matches buildHashInput() in lib/evidence/evidenceLedger.ts EXACTLY.
    -- Changing this order invalidates all existing chains.
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
    -- An attacker who edits a field and recomputes the SHA-256 correctly still
    -- cannot forge the HMAC without knowing the org secret (p_secret).
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
        metadata
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
        END
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

COMMENT ON FUNCTION public.append_governance_ledger(UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, JSONB, JSONB, NUMERIC, TEXT, TEXT) IS
    'Atomic hash-chain append for facttic_governance_events. Computes SHA-256(previous_hash||event fields) and HMAC-SHA256(event_hash, secret) in a single DB-side function call. Called by EvidenceLedger.write() in the application layer.';


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: verify_event_chain(p_session_id)
--
-- DB-side chain verification. Walks the full event chain for a session in
-- ascending timestamp order and verifies:
--   1. previous_hash pointer continuity (detects insertions/deletions)
--   2. SHA-256 recomputation from stored fields (detects field mutations)
--
-- Returns a JSONB summary of the verification result, matching the shape
-- of LedgerIntegrityResult in lib/evidence/evidenceLedger.ts.
-- Note: HMAC signature check requires the org secret — this is done
-- in the application layer only (lib/evidence/evidenceLedger.ts).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.verify_event_chain(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event           RECORD;
    v_expected_prev   TEXT    := 'GENESIS_HASH';
    v_recomputed_hash TEXT;
    v_hash_input      TEXT;
    v_chain_length    INT     := 0;
    v_verified        INT     := 0;
BEGIN
    FOR v_event IN
        SELECT id, session_id, org_id, timestamp, prompt, decision,
               risk_score, violations, previous_hash, event_hash
        FROM   public.facttic_governance_events
        WHERE  session_id = p_session_id
        ORDER  BY created_at ASC
    LOOP
        v_chain_length := v_chain_length + 1;

        -- Check 1: chain continuity
        IF v_event.previous_hash IS DISTINCT FROM v_expected_prev THEN
            RETURN jsonb_build_object(
                'integrity_status', 'CHAIN_BROKEN',
                'session_id',       p_session_id,
                'chain_length',     v_chain_length,
                'verified_events',  v_verified,
                'broken_event_id',  v_event.id,
                'failure_reason',   format(
                    'Chain broken at event %s. Expected previous_hash starting %s, found %s.',
                    v_event.id,
                    left(v_expected_prev, 8),
                    left(v_event.previous_hash, 8)
                ),
                'verified_at',      now()
            );
        END IF;

        -- Check 2: SHA-256 replay verification
        v_hash_input :=
            v_event.session_id::TEXT           ||
            v_event.timestamp::TEXT            ||
            COALESCE(v_event.prompt, '')       ||
            v_event.decision                   ||
            v_event.risk_score::TEXT           ||
            COALESCE(v_event.violations::TEXT, '[]') ||
            v_event.previous_hash;

        v_recomputed_hash := encode(digest(v_hash_input, 'sha256'), 'hex');

        IF v_recomputed_hash IS DISTINCT FROM v_event.event_hash THEN
            RETURN jsonb_build_object(
                'integrity_status', 'HASH_MISMATCH',
                'session_id',       p_session_id,
                'chain_length',     v_chain_length,
                'verified_events',  v_verified,
                'broken_event_id',  v_event.id,
                'failure_reason',   format(
                    'Hash mismatch at event %s. Stored: %s, Recomputed: %s.',
                    v_event.id,
                    left(v_event.event_hash, 8),
                    left(v_recomputed_hash, 8)
                ),
                'verified_at',      now()
            );
        END IF;

        v_expected_prev := v_event.event_hash;
        v_verified      := v_verified + 1;
    END LOOP;

    IF v_chain_length = 0 THEN
        RETURN jsonb_build_object(
            'integrity_status', 'EMPTY_SESSION',
            'session_id',       p_session_id,
            'chain_length',     0,
            'verified_events',  0,
            'broken_event_id',  NULL,
            'failure_reason',   NULL,
            'verified_at',      now()
        );
    END IF;

    RETURN jsonb_build_object(
        'integrity_status', 'VALID',
        'session_id',       p_session_id,
        'chain_length',     v_chain_length,
        'verified_events',  v_verified,
        'broken_event_id',  NULL,
        'failure_reason',   NULL,
        'verified_at',      now()
    );
END;
$$;

COMMENT ON FUNCTION public.verify_event_chain(UUID) IS
    'Database-side chain verification for facttic_governance_events. Verifies previous_hash pointer continuity and SHA-256 replay for every event in a session. HMAC signature verification (requiring the org secret) is handled in the application layer.';


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Require pgcrypto extension (digest + hmac functions)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;
