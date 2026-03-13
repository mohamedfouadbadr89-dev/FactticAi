-- Migration: 20260304000002_conversation_timeline.sql
-- Create Timeline Registry for Replay Capabilities

CREATE TABLE IF NOT EXISTS public.conversation_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('message', 'evaluation', 'drift_alert', 'governance_escalation')),
    event_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for chronological retrieval sequences
CREATE INDEX IF NOT EXISTS idx_timeline_session ON public.conversation_timeline(session_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON public.conversation_timeline(event_type);

-- RLS Enforcement
ALTER TABLE public.conversation_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view session timelines in their organization"
    ON public.conversation_timeline
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.sessions 
            WHERE org_id IN (
                SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Service Role can manage timeline"
    ON public.conversation_timeline
    FOR ALL
    USING (current_user = 'service_role');
