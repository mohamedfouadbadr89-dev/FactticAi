-- Extend forensic_events to mirror timeline data from facttic_governance_events.
-- These columns allow the forensic index to serve RCA and replay queries
-- without joining back to the main ledger table.

ALTER TABLE public.forensic_events
  ADD COLUMN IF NOT EXISTS source_event_id  UUID,
  ADD COLUMN IF NOT EXISTS session_id       UUID,
  ADD COLUMN IF NOT EXISTS event_type       TEXT    DEFAULT 'governance_decision',
  ADD COLUMN IF NOT EXISTS prompt           TEXT,
  ADD COLUMN IF NOT EXISTS model            TEXT,
  ADD COLUMN IF NOT EXISTS decision         TEXT,
  ADD COLUMN IF NOT EXISTS risk_score       NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS violations       JSONB   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS event_hash       TEXT,
  ADD COLUMN IF NOT EXISTS previous_hash    TEXT,
  ADD COLUMN IF NOT EXISTS latency          NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timestamp_ms     BIGINT;

-- Unique on source_event_id so upserts are idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_forensic_events_source
  ON public.forensic_events (source_event_id)
  WHERE source_event_id IS NOT NULL;

-- Fast lookup by session + org
CREATE INDEX IF NOT EXISTS idx_forensic_events_session
  ON public.forensic_events (session_id, org_id);

CREATE INDEX IF NOT EXISTS idx_forensic_events_org_created
  ON public.forensic_events (org_id, created_at DESC);
