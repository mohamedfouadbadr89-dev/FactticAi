-- Migration: 20260304000003_governance_event_ledger.sql
-- Create Tamper-Proof Audit Chain Ledger

CREATE TABLE IF NOT EXISTS public.governance_event_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('evaluation_created', 'drift_detected', 'policy_violation', 'governance_escalation')),
    event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, current_hash)
);

-- Indexing for sequential chain resolution
CREATE INDEX IF NOT EXISTS idx_ledger_org_chain ON public.governance_event_ledger(org_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ledger_hash ON public.governance_event_ledger(current_hash);

-- RLS Enforcement
ALTER TABLE public.governance_event_ledger ENABLE ROW LEVEL SECURITY;

-- Insert-only bounds protecting structural integrity
CREATE POLICY "Users can only read their org's ledger"
    ON public.governance_event_ledger
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service Role restricts mutations and allows certified inserts"
    ON public.governance_event_ledger
    FOR INSERT
    WITH CHECK (current_user = 'service_role');
