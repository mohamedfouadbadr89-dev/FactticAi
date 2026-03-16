-- ─── org_usage: per-org daily evaluation counter ─────────────────────────────
-- Tracks evaluations_today and token_usage with automatic daily reset.
-- increment_org_usage() is the single atomic entry point — callers never
-- touch this table directly.

-- 1. Add plan_tier to organizations (safe if already exists)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'pro', 'enterprise'));

-- 2. org_usage table
CREATE TABLE IF NOT EXISTS public.org_usage (
  org_id           UUID        PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  evaluations_today INT         NOT NULL DEFAULT 0,
  token_usage      BIGINT      NOT NULL DEFAULT 0,
  reset_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  last_updated     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_usage_reset_date ON public.org_usage (reset_date);

ALTER TABLE public.org_usage ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; org members can read their own usage
CREATE POLICY "org_members_read_own_usage"
  ON public.org_usage FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- 3. Atomic increment RPC
-- Increments evaluations_today (resetting at day boundary), checks the plan
-- limit, and returns the result in a single serialisable transaction.
CREATE OR REPLACE FUNCTION public.increment_org_usage(
  p_org_id  UUID,
  p_tokens  INT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_tier TEXT;
  v_limit     INT;
  v_evals     INT;
  v_tokens    BIGINT;
BEGIN
  -- Resolve plan tier (default free if org not found)
  SELECT COALESCE(plan_tier, 'free')
  INTO   v_plan_tier
  FROM   public.organizations
  WHERE  id = p_org_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code',    'org_not_found'
    );
  END IF;

  -- Plan daily evaluation limits
  v_limit := CASE v_plan_tier
    WHEN 'pro'        THEN 5000
    WHEN 'enterprise' THEN 50000
    ELSE                   500   -- free
  END;

  -- Atomic upsert: insert first row OR increment existing row.
  -- If reset_date < today the counter resets before incrementing.
  INSERT INTO public.org_usage (org_id, evaluations_today, token_usage, reset_date, last_updated)
  VALUES (p_org_id, 1, p_tokens, CURRENT_DATE, now())
  ON CONFLICT (org_id) DO UPDATE SET
    evaluations_today = CASE
      WHEN public.org_usage.reset_date < CURRENT_DATE THEN 1
      ELSE public.org_usage.evaluations_today + 1
    END,
    token_usage = CASE
      WHEN public.org_usage.reset_date < CURRENT_DATE THEN p_tokens
      ELSE public.org_usage.token_usage + p_tokens
    END,
    reset_date   = CURRENT_DATE,
    last_updated = now()
  RETURNING evaluations_today, token_usage
  INTO v_evals, v_tokens;

  RETURN jsonb_build_object(
    'evaluations_today', v_evals,
    'token_usage',       v_tokens,
    'limit',             v_limit,
    'plan_tier',         v_plan_tier,
    'allowed',           v_evals <= v_limit
  );
END;
$$;

-- Allow service role to call without auth.uid()
GRANT EXECUTE ON FUNCTION public.increment_org_usage(UUID, INT) TO service_role;
