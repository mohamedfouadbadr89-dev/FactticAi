-- Migration: Modality Persistence for AI Connections
-- Description: Standardize provider naming and add interaction mode support for multi-modal governance.

DO $$ 
BEGIN
    -- 1. Add interaction_mode column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_connections' AND column_name = 'interaction_mode'
    ) THEN
        ALTER TABLE public.ai_connections ADD COLUMN interaction_mode TEXT DEFAULT 'chat';
        COMMENT ON COLUMN public.ai_connections.interaction_mode IS 'The interaction modality (chat or voice).';
    END IF;

    -- 2. Rename provider to provider_type for consistency with registry
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_connections' AND column_name = 'provider'
    ) THEN
        ALTER TABLE public.ai_connections RENAME COLUMN provider TO provider_type;
    END IF;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_connections_mode_type ON public.ai_connections(interaction_mode, provider_type);
