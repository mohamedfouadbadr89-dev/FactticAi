-- Migration: 20260311000003_gateway_requests.sql
-- Description: Create gateway_requests table for central AI traffic routing

CREATE TABLE IF NOT EXISTS public.gateway_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    request_tokens NUMERIC DEFAULT 0,
    response_tokens NUMERIC DEFAULT 0,
    latency_ms NUMERIC DEFAULT 0,
    risk_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gateway_requests_org ON public.gateway_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_gateway_requests_created ON public.gateway_requests(created_at);

-- RLS
ALTER TABLE public.gateway_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gateway requests for their org"
    ON public.gateway_requests
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert gateway requests"
    ON public.gateway_requests
    FOR INSERT
    WITH CHECK (true);
