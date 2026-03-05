-- Migration: 20260318000001_disaster_recovery_snapshots.sql
-- Create disaster_recovery_snapshots table for monitoring recovery readiness

CREATE TABLE IF NOT EXISTS public.disaster_recovery_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id TEXT NOT NULL,
    db_checksum TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    restore_test_status TEXT CHECK (restore_test_status IN ('pending', 'passed', 'failed')),
    restore_test_time TIMESTAMP WITH TIME ZONE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dr_snapshots_created ON public.disaster_recovery_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_dr_snapshots_status ON public.disaster_recovery_snapshots(restore_test_status);

-- Comment for system tracking
COMMENT ON TABLE public.disaster_recovery_snapshots IS 'Tracks database snapshot integrity and automated recovery test results for DR compliance.';
