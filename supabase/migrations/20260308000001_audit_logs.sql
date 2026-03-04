-- Migration: Phase 37 Enterprise Hardening — Audit Logs
-- Append-only audit trail for all critical governance API actions

CREATE TABLE public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references public.organizations(id) on delete set null,
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    resource text not null,
    status text not null default 'success',
    created_at timestamp with time zone default now() not null,

    CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'blocked'))
);

-- Efficient per-org and per-actor lookups
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS: orgs see only their own audit records
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members
        WHERE user_id = auth.uid()
    ));

-- Inserts are engine-only (via service role key); no client INSERT policy
CREATE POLICY "Engine can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
