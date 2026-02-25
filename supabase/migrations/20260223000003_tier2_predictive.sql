-- Tier 2: Predictive Governance Extension
-- Description: Stores non-core predictive risk snapshots.

CREATE TABLE IF NOT EXISTS public.governance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    baseline_value NUMERIC DEFAULT 0.0,
    current_value NUMERIC DEFAULT 0.0,
    drift_score NUMERIC DEFAULT 0.0,
    risk_index NUMERIC DEFAULT 0.0,
    horizon TEXT CHECK (horizon IN ('24h', '7d')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.governance_predictions ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Scoped to members
CREATE POLICY "Users can view predictions for their organization"
ON public.governance_predictions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = governance_predictions.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX idx_gov_pred_org ON public.governance_predictions(org_id);
CREATE INDEX idx_gov_pred_created ON public.governance_predictions(created_at);
