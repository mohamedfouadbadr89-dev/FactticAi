-- Migration: Phase 46 Human-in-the-Loop Review System
-- Stores review queue entries for flagged sessions

CREATE TABLE public.review_queue (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    session_id text not null,
    risk_score numeric(5,2) not null default 0 CHECK (risk_score BETWEEN 0 AND 100),
    status text not null default 'pending',
    assigned_to uuid references auth.users(id) on delete set null,
    notes text,
    flagged_reason text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_review', 'resolved', 'escalated', 'dismissed'))
);

CREATE INDEX idx_review_queue_org_id     ON public.review_queue(org_id);
CREATE INDEX idx_review_queue_status     ON public.review_queue(status);
CREATE INDEX idx_review_queue_risk_score ON public.review_queue(risk_score DESC);
CREATE INDEX idx_review_queue_created_at ON public.review_queue(created_at DESC);

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read their review queue"
    ON public.review_queue FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Organization members can insert to review queue"
    ON public.review_queue FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Assigned reviewers and admins can update"
    ON public.review_queue FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));
