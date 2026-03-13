-- Migration: 20260304000007_hallucination_fingerprint.sql
-- Extend cross_session_patterns with deterministic fingerprinting fields

ALTER TABLE public.cross_session_patterns 
ADD COLUMN IF NOT EXISTS fingerprint TEXT,
ADD COLUMN IF NOT EXISTS prompt_hash TEXT,
ADD COLUMN IF NOT EXISTS model TEXT;

-- Create index for high-performance hallucination frequency lookups
CREATE INDEX IF NOT EXISTS idx_hallucination_fingerprint 
ON public.cross_session_patterns(fingerprint);

-- Comment for documentation
COMMENT ON COLUMN public.cross_session_patterns.fingerprint IS 'Deterministic SHA256 hash of normalized response + prompt context';
