-- Migration: 20260311000005_autonomous_actions.sql
-- Description: Create autonomous_actions table for automated governance execution

CREATE TABLE IF NOT EXISTS public.autonomous_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('reduce_temp', 'switch_provider', 'block', 'review', 'redact')),
    confidence NUMERIC NOT NULL DEFAULT 0,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_org ON public.autonomous_actions(org_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_ts ON public.autonomous_actions(created_at);

-- RLS
ALTER TABLE public.autonomous_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view autonomous actions for their org"
    ON public.autonomous_actions
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert autonomous actions"
    ON public.autonomous_actions
    FOR INSERT
    WITH CHECK (true);
