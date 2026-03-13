-- Migration: 20260320000001_governance_review_queue.sql
-- Create governance_review_queue table for human-in-the-loop auditing

CREATE TABLE IF NOT EXISTS public.governance_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.conversation_timeline(session_id) ON DELETE CASCADE,
    risk_score FLOAT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'reviewing', 'resolved')),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_review_queue_session ON public.governance_review_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON public.governance_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_reviewer ON public.governance_review_queue(reviewer_id);

-- RLS Policies
ALTER TABLE public.governance_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view the review queue"
    ON public.governance_review_queue
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow auditors to update review status"
    ON public.governance_review_queue
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Comment for system tracking
COMMENT ON TABLE public.governance_review_queue IS 'Queue for high-risk AI sessions requiring manual human forensic audit and resolution.';
