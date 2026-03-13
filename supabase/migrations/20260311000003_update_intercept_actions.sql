-- Migration: 20260311000003_update_intercept_actions.sql
-- Description: Update runtime_intercepts action check constraint to include 'redact'

ALTER TABLE public.runtime_intercepts DROP CONSTRAINT IF EXISTS runtime_intercepts_action_check;
ALTER TABLE public.runtime_intercepts ADD CONSTRAINT runtime_intercepts_action_check CHECK (action IN ('allow','warn','block','rewrite','escalate','redact'));
