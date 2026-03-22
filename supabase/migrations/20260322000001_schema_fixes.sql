-- Migration: 20260322000001_schema_fixes.sql
-- Description: Urgent schema fixes for sessions and incidents tables

-- Fix 1: Add model_name to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT 'default';

-- Fix 2: Add status to incidents table  
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
CHECK (status IN ('open', 'investigating', 'resolved'));

-- Fix 3: Update sessions RLS to match existing pattern
-- Pattern from facttic_governance_events to ensure cross-tenant safety
DROP POLICY IF EXISTS "tenant_isolation_sessions" ON public.sessions;
CREATE POLICY "tenant_isolation_sessions" ON public.sessions 
AS PERMISSIVE FOR ALL 
USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()) 
    OR auth.role() = 'service_role'
);
