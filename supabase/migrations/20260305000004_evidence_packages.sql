-- Migration: Phase 30 Governance Evidence Engine
-- Creates the immutable evidence_packages table logging all generated cryptographic AI audit packages.

CREATE TABLE IF NOT EXISTS public.evidence_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    timeframe_start TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe_end TIMESTAMP WITH TIME ZONE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('SOC2', 'AI_GOVERNANCE', 'RISK_AUDIT', 'FORENSIC_PACKAGE')),
    evidence_hash TEXT NOT NULL,
    package_location TEXT NOT NULL, -- Logical URI or JSON structure blob reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_packages_org_id ON public.evidence_packages(org_id);
CREATE INDEX IF NOT EXISTS idx_evidence_packages_generated_at ON public.evidence_packages(generated_at);

-- Enable RLS
ALTER TABLE public.evidence_packages ENABLE ROW LEVEL SECURITY;

-- Strict Immutable RLS Policies
CREATE POLICY "Org members can read their own evidence packages"
    ON public.evidence_packages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = evidence_packages.org_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert evidence packages"
    ON public.evidence_packages FOR INSERT
    WITH CHECK (true); -- Usually restricted to authenticated edge functions / services
