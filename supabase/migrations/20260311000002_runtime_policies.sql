-- Migration: 20260311000002_runtime_policies.sql
-- Description: Create runtime_policies table for custom organization rules

CREATE TABLE IF NOT EXISTS public.runtime_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition JSONB NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('allow','warn','block','rewrite','escalate','redact')),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_runtime_policies_org ON public.runtime_policies(org_id);

-- RLS
ALTER TABLE public.runtime_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage policies for their org"
    ON public.runtime_policies
    FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can read policies"
    ON public.runtime_policies
    FOR SELECT
    USING (true);
