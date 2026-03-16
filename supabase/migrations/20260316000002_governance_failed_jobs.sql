-- =============================================================================
-- Migration: 20260316000002_governance_failed_jobs.sql
-- Phase: Dead Letter Queue for Async Governance
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.governance_failed_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    org_id UUID,
    payload JSONB NOT NULL,
    error_message TEXT,
    failed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for dashboard metrics
CREATE INDEX IF NOT EXISTS idx_gov_failed_jobs_org ON public.governance_failed_jobs(org_id);
