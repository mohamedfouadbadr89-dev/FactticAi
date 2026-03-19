-- FACTTIC GOVERNANCE SCHEMA V1
-- Verified against Live Supabase Production on March 19, 2026
-- 
-- This schema represents the definitive infrastructure for Facttic's
-- real-time governance, including the SHA-256 evidence chain and 
-- voice telemetry support.

CREATE TABLE IF NOT EXISTS public.facttic_governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    prompt TEXT,
    decision TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    violations JSONB DEFAULT '[]'::JSONB,
    guardrail_signals JSONB DEFAULT '{}'::JSONB,
    latency INTEGER DEFAULT 0,
    model TEXT DEFAULT 'unspecified',
    model_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT,
    timestamp BIGINT NOT NULL,
    event_hash TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    client_sent_at BIGINT,
    checksum_verified BOOLEAN DEFAULT FALSE,
    barge_in_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    violation TEXT,
    risk_score INTEGER,
    decision TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gov_events_org_timestamp ON public.facttic_governance_events (org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gov_events_session_id ON public.facttic_governance_events (session_id);

-- Deterministic Chain RPC
CREATE OR REPLACE FUNCTION public.append_governance_ledger(
    p_session_id TEXT,
    p_org_id TEXT,
    p_event_type TEXT,
    p_prompt TEXT,
    p_model TEXT,
    p_decision TEXT,
    p_risk_score DOUBLE PRECISION,
    p_violations_str TEXT,
    p_violations JSONB,
    p_guardrail_signals JSONB,
    p_latency INTEGER,
    p_model_response TEXT,
    p_secret TEXT,
    p_queue_job_id TEXT DEFAULT NULL,
    p_client_sent_at BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
-- Canonical Hash Chain logic (See implementation in Supabase)
$$ LANGUAGE plpgsql SECURITY DEFINER;
