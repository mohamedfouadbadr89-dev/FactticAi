-- ARCHITECTURE RECONCILIATION MIGRATION
-- Step 1: Verify Existing Tables

CREATE TABLE IF NOT EXISTS public.facttic_governance_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    org_id UUID,
    event_type TEXT,
    decision TEXT,
    risk_score NUMERIC,
    latency NUMERIC,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    event_hash TEXT,
    previous_hash TEXT
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.governance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.governance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.governance_snapshot_v1 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forensic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Governance Ledger Structure (Add Missing Columns & Rename id -> event_id safely)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facttic_governance_events' AND column_name = 'id') THEN
        ALTER TABLE public.facttic_governance_events RENAME COLUMN id TO event_id;
    END IF;
END $$;

ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'governance_decision';
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'ALLOW';
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS risk_score NUMERIC DEFAULT 0;
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS latency NUMERIC DEFAULT 0;
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'unspecified';
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS event_hash TEXT;
ALTER TABLE public.facttic_governance_events ADD COLUMN IF NOT EXISTS previous_hash TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS idx_facttic_events_org_created_at_desc ON public.facttic_governance_events (org_id, created_at DESC);

-- Step 3: Multi-Tenant Isolation & Step 6 Security Hardening (RLS)
ALTER TABLE public.facttic_governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_predictions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['facttic_governance_events', 'sessions', 'governance_alerts', 'incidents', 'governance_predictions'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "tenant_isolation_%I" ON public.%I AS PERMISSIVE FOR ALL USING (
            org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()) OR auth.role() = ''service_role''
        )', t_name, t_name);
    END LOOP;
END $$;
