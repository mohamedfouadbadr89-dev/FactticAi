-- ══════════════════════════════════════════════════════════════════
-- Facttic Subscription System
-- Provider-agnostic — ready to connect Stripe/Paddle/LemonSqueezy
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Plans ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id                   TEXT PRIMARY KEY,          -- 'starter' | 'growth' | 'scale'
  name                 TEXT        NOT NULL,
  description          TEXT,
  monthly_price_cents  INTEGER     NOT NULL,       -- e.g. 3900 = $39.00
  annual_price_cents   INTEGER     NOT NULL,       -- billed annually / 12
  interaction_limit    INTEGER     NOT NULL,       -- monthly cap
  features             JSONB       DEFAULT '[]',
  is_active            BOOLEAN     DEFAULT true,
  sort_order           INTEGER     DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans from pricing.ts
INSERT INTO plans (id, name, description, monthly_price_cents, annual_price_cents, interaction_limit, features, sort_order)
VALUES
  ('starter', 'Starter', 'Entry-level AI governance protection', 3900, 3120, 10000,
   '["Governance monitoring","Risk alerts","Playground access","Basic reporting"]', 1),
  ('growth', 'Growth', 'High velocity teams & production AI', 12900, 10320, 50000,
   '["Incident timeline","Simulator lab","Full policy engine","Priority interceptors","Forensics access"]', 2),
  ('scale', 'Scale', 'Unlimited observability at enterprise scale', 34900, 27920, 200000,
   '["Governance analytics","Drift intelligence","Full forensics tools","Custom guardrails","Dedicated support","SLA guarantee"]', 3)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Subscriptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID        NOT NULL,
  plan_id                TEXT        NOT NULL REFERENCES plans(id),
  billing_cycle          TEXT        NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'annual'
  status                 TEXT        NOT NULL DEFAULT 'trialing', -- 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused'
  trial_ends_at          TIMESTAMPTZ,
  current_period_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancelled_at           TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     DEFAULT false,
  -- Payment provider hooks (populate when Stripe/Paddle connected)
  stripe_subscription_id TEXT,
  stripe_customer_id     TEXT,
  paddle_subscription_id TEXT,
  external_ref           TEXT,
  -- Notes
  notes                  TEXT,
  metadata               JSONB       DEFAULT '{}',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'annual')),
  CONSTRAINT valid_status        CHECK (status IN ('trialing','active','past_due','cancelled','paused'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id  ON subscriptions (org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions (plan_id);

-- ── 3. Subscription Events (immutable audit log) ─────────────────
CREATE TABLE IF NOT EXISTS subscription_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL,
  subscription_id  UUID        REFERENCES subscriptions(id),
  event_type       TEXT        NOT NULL,  -- 'created'|'upgraded'|'downgraded'|'cancelled'|'renewed'|'paused'|'reactivated'|'trial_ended'
  from_plan_id     TEXT,
  to_plan_id       TEXT,
  from_status      TEXT,
  to_status        TEXT,
  amount_cents     INTEGER,
  billing_cycle    TEXT,
  actor_user_id    UUID,
  metadata         JSONB       DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_org_id    ON subscription_events (org_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type      ON subscription_events (event_type);
CREATE INDEX IF NOT EXISTS idx_sub_events_created   ON subscription_events (created_at DESC);

-- ── 4. Updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- ── 5. Admin view: subscriber list with org info ──────────────────
CREATE OR REPLACE VIEW admin_subscribers AS
SELECT
  s.id                    AS subscription_id,
  s.org_id,
  s.plan_id,
  p.name                  AS plan_name,
  p.monthly_price_cents,
  p.annual_price_cents,
  s.billing_cycle,
  s.status,
  s.trial_ends_at,
  s.current_period_start,
  s.current_period_end,
  s.cancelled_at,
  s.cancel_at_period_end,
  s.stripe_subscription_id,
  s.created_at            AS subscribed_at,
  s.updated_at,
  -- MRR contribution in cents
  CASE
    WHEN s.status NOT IN ('active','trialing') THEN 0
    WHEN s.billing_cycle = 'annual' THEN p.annual_price_cents
    ELSE p.monthly_price_cents
  END                     AS mrr_cents
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id;

-- ── 6. RLS Policies ───────────────────────────────────────────────
ALTER TABLE plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- plans: public read
CREATE POLICY plans_public_read ON plans FOR SELECT USING (true);

-- subscriptions: org members can read their own
CREATE POLICY subscriptions_org_read ON subscriptions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- subscription_events: org members can read their own
CREATE POLICY sub_events_org_read ON subscription_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );
