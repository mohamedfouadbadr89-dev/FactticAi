-- Migration: Org onboarding progress tracking
-- Description: Adds onboarding_step + onboarding_completed_at columns to org_members
-- so QuickStart can persist progress server-side instead of relying on user_metadata
-- or client-only state. Onboarding is treated as an org-level event: once any
-- teammate advances a step, the whole org sees the same progress.

ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT
    NOT NULL DEFAULT 'connect'
    CHECK (onboarding_step IN ('connect', 'policy', 'test', 'dashboard', 'complete')),
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Index for the common lookup pattern: "what is this org's onboarding state?"
CREATE INDEX IF NOT EXISTS idx_org_members_onboarding_step
  ON public.org_members (org_id, onboarding_step);
