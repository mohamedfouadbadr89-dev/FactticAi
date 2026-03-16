-- =============================================================================
-- Migration: 20260316000005_governance_queue_signature.sql
-- Phase: Asynchronous Payload Integrity Security
-- =============================================================================

ALTER TABLE public.governance_failed_jobs
ADD COLUMN IF NOT EXISTS signature TEXT;
