-- Migration: 20260314000001_agent_sessions.sql
-- Description: Create agent_sessions and agent_steps tables for AI Agent governance

-- Table: agent_sessions
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    agent_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    risk_score NUMERIC DEFAULT 0,
    steps INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_agent_status CHECK (status IN ('running', 'paused', 'blocked', 'completed', 'escalated'))
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_name ON public.agent_sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_sid ON public.agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_org ON public.agent_sessions(org_id);

-- Table: agent_steps
CREATE TABLE IF NOT EXISTS public.agent_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    tool_name TEXT,
    model_name TEXT,
    risk_score NUMERIC DEFAULT 0,
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_agent_action CHECK (action_type IN ('reasoning', 'llm_call', 'tool_call', 'api_call', 'memory_write'))
);

CREATE INDEX IF NOT EXISTS idx_agent_steps_sid ON public.agent_steps(session_id);

-- RLS
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent sessions"
    ON public.agent_sessions FOR SELECT
    TO authenticated
    USING (org_id IN (SELECT id FROM public.organizations));

CREATE POLICY "Users can view agent steps"
    ON public.agent_steps FOR SELECT
    TO authenticated
    USING (session_id IN (SELECT session_id FROM public.agent_sessions));
