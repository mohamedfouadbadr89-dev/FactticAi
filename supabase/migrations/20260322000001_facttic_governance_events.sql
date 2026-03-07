-- Migration: Evidence Ledger Core Table
-- Description: Creates facttic_governance_events, the primary persistence target for
-- EvidenceLedger.write(). Feeds Forensics Timeline, Session Replay, and Sessions list.

CREATE TABLE IF NOT EXISTS public.facttic_governance_events (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID    NOT NULL,
    org_id          UUID    NOT NULL,
    -- Unix epoch in milliseconds (Date.now()) — used by timeline builder via Number(row.timestamp)
    timestamp       BIGINT  NOT NULL,
    event_type      TEXT    NOT NULL DEFAULT 'governance_decision',
    prompt          TEXT,
    model           TEXT    NOT NULL DEFAULT 'unspecified',
    decision        TEXT    NOT NULL,
    risk_score      NUMERIC NOT NULL DEFAULT 0,
    violations      JSONB   NOT NULL DEFAULT '[]'::jsonb,
    guardrail_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    latency         NUMERIC NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fge_session_id  ON public.facttic_governance_events(session_id);
CREATE INDEX IF NOT EXISTS idx_fge_org_id      ON public.facttic_governance_events(org_id);
CREATE INDEX IF NOT EXISTS idx_fge_timestamp   ON public.facttic_governance_events(timestamp DESC);

-- RLS
ALTER TABLE public.facttic_governance_events ENABLE ROW LEVEL SECURITY;

-- Service role (used by EvidenceLedger.write via supabaseServer) can insert
CREATE POLICY "service_role_insert_governance_events"
    ON public.facttic_governance_events FOR INSERT
    WITH CHECK (true);

-- Authenticated users can read events belonging to their org
CREATE POLICY "org_members_read_governance_events"
    ON public.facttic_governance_events FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );
