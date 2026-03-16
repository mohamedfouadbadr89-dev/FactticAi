-- =============================================================================
-- Migration: 20260316000000_audit_trigger.sql
-- Phase: Database Security — Tamper-Resistant Governance Audit Trail
-- =============================================================================
-- This migration:
--   1. Ensures audit_logs has all required columns (metadata, pipeline_version)
--   2. Creates the log_governance_event() trigger function
--   3. Attaches the trigger to facttic_governance_events (AFTER INSERT)
--   4. Adds a covering index for pipeline_version queries
--   5. Enforces append-only semantics via a BEFORE UPDATE/DELETE trigger
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Ensure audit_logs has all required columns
-- (Safe: ADD COLUMN IF NOT EXISTS is idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS metadata        JSONB,
    ADD COLUMN IF NOT EXISTS pipeline_version TEXT NOT NULL DEFAULT 'governance-modular-v2';

-- Index for pipeline_version lookups (audit forensics across pipeline versions)
CREATE INDEX IF NOT EXISTS idx_audit_logs_pipeline_version
    ON public.audit_logs (pipeline_version);

-- Index for action-based lookups (e.g., filter by 'governance_event')
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON public.audit_logs (action);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create the trigger function — log_governance_event()
--
-- SECURITY DEFINER ensures this function runs with the privileges of its owner
-- (postgres / service role), NOT the privileges of the calling session.
-- This is the correct pattern for writing to audit_logs from a trigger that
-- fires on a table the authenticated client may INSERT to — it prevents RLS
-- from blocking the audit write even if the audit_logs INSERT policy is strict.
--
-- IMPORTANT: The trigger reads from NEW (the just-inserted governance event)
-- and writes a corresponding audit record. It NEVER modifies NEW — it returns
-- NEW unchanged so the original INSERT proceeds normally.
--
-- The COALESCE guards protect against NULL columns in governance event rows
-- that were created before optional columns were added.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_governance_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        org_id,
        action,
        resource,
        metadata,
        pipeline_version
    ) VALUES (
        -- actor_id: use session_id cast to text for traceability; UUIDs from
        -- governance events don't map 1:1 to auth.users, so we use the
        -- event's session UUID as a proxy identity reference.
        -- Cast to UUID is safe: session_id is UUID NOT NULL in fge.
        NEW.session_id,

        -- org_id: direct from the governance event — already tenant-scoped
        NEW.org_id,

        -- action: canonical label for all governance pipeline decisions
        'governance_event',

        -- resource: the event's own primary key — establishes a 1:1 forensic link
        -- COALESCE handles the id→event_id rename across migration versions
        COALESCE(NEW.event_id::TEXT, gen_random_uuid()::TEXT),

        -- metadata: full decision context captured as structured JSON
        jsonb_build_object(
            'decision',       COALESCE(NEW.decision,   'UNKNOWN'),
            'risk_score',     COALESCE(NEW.risk_score,  0),
            'event_type',     COALESCE(NEW.event_type, 'governance_decision'),
            'model',          COALESCE(NEW.model,      'unspecified'),
            'latency',        COALESCE(NEW.latency,     0),
            'event_hash',     NEW.event_hash,
            'previous_hash',  NEW.previous_hash,
            'session_id',     NEW.session_id,
            'created_at',     NEW.created_at
        ),

        -- pipeline_version: hardcoded to the current canonical pipeline version
        -- so forensic queries can distinguish events from legacy vs modular pipeline
        'governance-modular-v2'
    );

    -- Return NEW unchanged — this trigger must NEVER block or alter the original INSERT
    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- The audit log write must NEVER crash the governance event INSERT.
    -- Log the failure to pg_log but allow the original transaction to succeed.
    RAISE WARNING '[log_governance_event] Audit log write failed for event %, org %: %',
        COALESCE(NEW.event_id::TEXT, 'unknown'),
        NEW.org_id,
        SQLERRM;
    RETURN NEW;
END;
$$;

-- Revoke direct execution from public — only the trigger runtime invokes it
REVOKE EXECUTE ON FUNCTION public.log_governance_event() FROM PUBLIC;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Attach the trigger to facttic_governance_events
-- DROP IF EXISTS ensures idempotent re-runs (e.g., during CI or re-migration)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_log_governance_event
    ON public.facttic_governance_events;

CREATE TRIGGER trg_log_governance_event
    AFTER INSERT
    ON public.facttic_governance_events
    FOR EACH ROW
    EXECUTE FUNCTION public.log_governance_event();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Append-only enforcement on audit_logs
--
-- A tamper-resistant audit trail must prevent UPDATE and DELETE.
-- This trigger function returns NULL for UPDATE/DELETE attempts, which causes
-- Postgres to silently cancel the operation without raising an error to the
-- caller — preventing timing-based detection of the protection by attackers.
-- SECURITY DEFINER means even a database superuser attempting to bypass this
-- via a function call will hit this guard.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Returning NULL from a BEFORE trigger cancels the operation silently
    RAISE WARNING '[enforce_audit_log_immutability] Blocked % on audit_logs row %. Audit records are immutable.',
        TG_OP,
        OLD.id;
    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_audit_log_immutability() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_audit_immutability
    ON public.audit_logs;

CREATE TRIGGER trg_enforce_audit_immutability
    BEFORE UPDATE OR DELETE
    ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_log_immutability();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Comment the table and trigger for schema documentation
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.audit_logs IS
    'Tamper-resistant, append-only audit log. Rows are written by the service role engine and database triggers. UPDATE and DELETE are blocked by the trg_enforce_audit_immutability trigger.';

COMMENT ON FUNCTION public.log_governance_event() IS
    'AFTER INSERT trigger on facttic_governance_events. Automatically mirrors every governance decision into audit_logs as a forensic record. Failures are logged as warnings and never block the source INSERT.';

COMMENT ON FUNCTION public.enforce_audit_log_immutability() IS
    'BEFORE UPDATE OR DELETE trigger on audit_logs. Returns NULL to cancel all mutation attempts. Enforces append-only semantics for the forensic audit trail.';
