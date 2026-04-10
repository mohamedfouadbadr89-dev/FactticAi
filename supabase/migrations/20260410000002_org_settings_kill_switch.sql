-- Migration: Org-level settings table with kill switch
-- Description: Creates org_settings as a per-org settings container and seeds
-- it with a kill switch flag. When enabled, GovernancePipeline.execute() will
-- short-circuit with a passthrough ALLOW decision so traffic keeps flowing
-- while enforcement is temporarily suspended.
--
-- Added (not modifying any existing table): new org_settings table.

CREATE TABLE IF NOT EXISTS public.org_settings (
    org_id                    UUID        PRIMARY KEY,
    kill_switch_enabled       BOOLEAN     NOT NULL DEFAULT false,
    kill_switch_reason        TEXT,
    kill_switch_updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    kill_switch_updated_by    UUID
);

-- Fast existence lookup for the read path
CREATE INDEX IF NOT EXISTS idx_org_settings_kill_switch_enabled
    ON public.org_settings (org_id)
    WHERE kill_switch_enabled = true;

-- Row Level Security
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no user policy needed here because all access
-- is gated by withAuth + org_id scoping at the API layer.
