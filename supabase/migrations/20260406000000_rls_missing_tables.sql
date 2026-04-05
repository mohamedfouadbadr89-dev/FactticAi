-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Enable Row Level Security on tables that were missing it
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. governance_failed_jobs
ALTER TABLE governance_failed_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON governance_failed_jobs
  FOR ALL USING (org_id = (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1
  ));

-- 2. predictive_drift_events
ALTER TABLE predictive_drift_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON predictive_drift_events
  FOR ALL USING (org_id = (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1
  ));

-- 3. forensic_events
ALTER TABLE forensic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON forensic_events
  FOR ALL USING (org_id = (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1
  ));

-- 4. disaster_recovery_snapshots — system table, restrict to service role only
ALTER TABLE disaster_recovery_snapshots ENABLE ROW LEVEL SECURITY;

-- No user-facing policy — only service role (bypasses RLS) should access this
-- This effectively blocks all direct user queries
CREATE POLICY "deny_all_direct_access" ON disaster_recovery_snapshots
  FOR ALL USING (false);
