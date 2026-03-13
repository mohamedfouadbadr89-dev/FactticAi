-- Migration: Phase 34 Governance Policy Engine
-- Description: Core schema mapping custom organizational evaluation thresholds and rulesets

CREATE TABLE public.governance_policies (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    policy_name text not null,
    rule_type text not null,
    threshold numeric not null,
    action text not null,
    created_at timestamp with time zone default now() not null,
    
    -- Ensure exact rule domains match Facttic design constraints
    CONSTRAINT valid_rule_type CHECK (rule_type IN (
        'hallucination_rate',
        'tone_violation',
        'pii_exposure',
        'instruction_override',
        'safety_violation'
    )),
    
    -- Ensure exact bound behaviors
    CONSTRAINT valid_action CHECK (action IN (
        'warn', 
        'block', 
        'escalate'
    ))
);

-- Active querying indexes
CREATE INDEX idx_governance_policies_org_id ON public.governance_policies(org_id);
CREATE INDEX idx_governance_policies_rule_type ON public.governance_policies(rule_type);

-- RLS Enforcement
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage their own policies"
    ON public.governance_policies FOR ALL
    USING (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ))
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members 
        WHERE user_id = auth.uid()
    ));

-- Engine Service Rule Read Access (Internal Only System Override Bypass via auth.uid() if needed, otherwise rely on Service Key)
CREATE POLICY "Engine can read all policies"
    ON public.governance_policies FOR SELECT
    USING (true);
