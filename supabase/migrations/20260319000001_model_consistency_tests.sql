-- Migration: 20260319000001_model_consistency_tests.sql
-- Create model_consistency_tests table to track behavioral variations across LLM providers

CREATE TABLE IF NOT EXISTS public.model_consistency_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_hash TEXT NOT NULL,
    model_a TEXT NOT NULL,
    model_b TEXT NOT NULL,
    similarity_score FLOAT NOT NULL CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_consistency_prompt ON public.model_consistency_tests(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_consistency_models ON public.model_consistency_tests(model_a, model_b);

-- RLS Policies
ALTER TABLE public.model_consistency_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to consistency metrics"
    ON public.model_consistency_tests
    FOR SELECT
    USING (true);

-- Comment for system tracking
COMMENT ON TABLE public.model_consistency_tests IS 'Stores semantic similarity results between different LLM providers for the same prompt fingerprints.';
