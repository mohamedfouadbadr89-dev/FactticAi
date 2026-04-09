-- Migration: Add governance columns to sessions table
-- These columns are written by GovernancePipeline.persistInternal()
-- and read by /api/governance/sessions and /dashboard/replay

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS total_risk NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'ALLOW',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ DEFAULT now();

-- session_turns: ensure org_id and incremental_risk exist
ALTER TABLE public.session_turns
  ADD COLUMN IF NOT EXISTS org_id UUID,
  ADD COLUMN IF NOT EXISTS decision TEXT,
  ADD COLUMN IF NOT EXISTS incremental_risk NUMERIC DEFAULT 0;

-- incidents: ensure timestamp column exists (pipeline writes it, incidents page orders by it)
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'BLOCK';
