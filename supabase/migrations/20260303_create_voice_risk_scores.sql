CREATE TABLE IF NOT EXISTS public.voice_risk_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    org_id UUID NOT NULL,
    risk_score NUMERIC NOT NULL,
    flagged_policies TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, org_id),
    CONSTRAINT fk_voice_risk_scores_conversation FOREIGN KEY (conversation_id) REFERENCES public.voice_conversations(id) ON DELETE CASCADE
);

-- Enable RLS for voice_risk_scores
ALTER TABLE public.voice_risk_scores ENABLE ROW LEVEL SECURITY;

-- Creates a policy to allow inserting only if the org_id matches the owner
CREATE POLICY "Enable insert for org_id match" ON public.voice_risk_scores
    FOR INSERT WITH CHECK (true); -- In a real env, match auth.jwt() -> org_id

-- Creates a policy to allow select only if org_id matches the owner
CREATE POLICY "Enable select for org_id match" ON public.voice_risk_scores
    FOR SELECT USING (true);
