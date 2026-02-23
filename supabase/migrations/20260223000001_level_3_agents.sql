-- Level 3: Multi-Agent Isolation Layer
-- Description: Establishes the agents table with strict RLS and secure RPC ingestion.

-- 1. Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text CHECK (type IN ('chat','voice')) NOT NULL,
    version text NOT NULL,
    prompt_snapshot jsonb NOT NULL,
    config_snapshot jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, name, version)
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON public.agents(org_id);

-- 2. Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- SELECT: Scoped to members of the organization
CREATE POLICY "Agents are viewable by organization members"
ON public.agents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = agents.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- INSERT: Scoped to members
CREATE POLICY "Agents are insertable by organization members"
ON public.agents
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = agents.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- UPDATE: Scoped to members
CREATE POLICY "Agents are updatable by organization members"
ON public.agents
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = agents.org_id
        AND org_members.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = agents.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- DELETE: role='owner' only
CREATE POLICY "Agents are deletable by organization owners only"
ON public.agents
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = agents.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
    )
);

-- 4. RPC for Secure Ingestion
CREATE OR REPLACE FUNCTION public.create_agent(
    p_org_id uuid,
    p_name text,
    p_type text,
    p_version text,
    p_prompt_snapshot jsonb,
    p_config_snapshot jsonb,
    p_is_active boolean DEFAULT true
)
RETURNS uuid AS $$
DECLARE
    v_agent_id uuid;
BEGIN
    -- Harden against search_path injection
    PERFORM set_config('search_path', 'public', false);

    -- Validate membership using auth.uid()
    IF NOT EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() AND org_id = p_org_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of the specified organization';
    END IF;

    -- Insert agent
    INSERT INTO public.agents (
        org_id,
        name,
        type,
        version,
        prompt_snapshot,
        config_snapshot,
        is_active
    )
    VALUES (
        p_org_id,
        p_name,
        p_type,
        p_version,
        p_prompt_snapshot,
        p_config_snapshot,
        p_is_active
    )
    RETURNING id INTO v_agent_id;

    -- 5. Audit Logging (Mandatory per protocol)
    INSERT INTO public.audit_logs (
        org_id,
        actor_id,
        action,
        metadata
    )
    VALUES (
        p_org_id,
        auth.uid(),
        'CREATE_AGENT',
        jsonb_build_object(
            'agent_id', v_agent_id,
            'agent_name', p_name,
            'agent_version', p_version
        )
    );

    RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
