-- =============================================================================
-- Migration: 20260316000003_governance_failed_jobs_replayed.sql
-- Phase: Dead Letter Queue Replay Tracking
-- =============================================================================

ALTER TABLE public.governance_failed_jobs 
ADD COLUMN IF NOT EXISTS replayed_at TIMESTAMPTZ;

-- Index for dashboard metrics distinguishing replayed vs un-replayed jobs
CREATE INDEX IF NOT EXISTS idx_gov_failed_jobs_replayed ON public.governance_failed_jobs(replayed_at);
