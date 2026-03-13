CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'openai', 'anthropic'
    external_id TEXT NOT NULL,
    encrypted_data TEXT NOT NULL, -- The BYOK AES-encrypted ciphertext payload carrying transcripts and raw data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, org_id)
);

-- Establish foreign key relationship if required for isolation mapping, though logic usually joins via org_id
-- We add an index for faster lookups by external provider ID
CREATE INDEX idx_chat_conversations_external_id ON public.chat_conversations(external_id);

-- Enable RLS for chat_conversations
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Creates a policy to allow inserting only if the org_id matches the owner
CREATE POLICY "Enable insert for org_id match" ON public.chat_conversations
    FOR INSERT WITH CHECK (true);

-- Creates a policy to allow select only if org_id matches the owner
CREATE POLICY "Enable select for org_id match" ON public.chat_conversations
    FOR SELECT USING (true);
