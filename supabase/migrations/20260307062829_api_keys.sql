CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    key_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: Add an index on key_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
