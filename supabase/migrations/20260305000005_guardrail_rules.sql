-- Migration: Phase 31 Real-Time Governance Guardrails
-- Creates the guardrail_rules table to enforce real-time response interception.

CREATE TABLE IF NOT EXISTS public.guardrail_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('hallucination', 'policy_violation', 'tone_violation', 'safety_violation')),
    threshold NUMERIC NOT NULL CHECK (threshold >= 0 AND threshold <= 1),
    action TEXT NOT NULL CHECK (action IN ('block', 'warn', 'escalate')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for rapid in-line interception checks
CREATE INDEX IF NOT EXISTS idx_guardrail_rules_org_id ON public.guardrail_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_rules_active ON public.guardrail_rules(org_id, is_active);

-- Enable RLS
ALTER TABLE public.guardrail_rules ENABLE ROW LEVEL SECURITY;

-- Strict Immutable RLS Policies
CREATE POLICY "Org members can read active guardrail rules"
    ON public.guardrail_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = guardrail_rules.org_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Org Admins can manage guardrail rules"
    ON public.guardrail_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.org_id = guardrail_rules.org_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin')
        )
    );
