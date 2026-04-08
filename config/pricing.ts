/**
 * Facttic Pricing Configuration
 *
 * METRIC: "sessions" = one complete AI conversation (voice call OR chat thread).
 * One session = one governance evaluation run.
 *
 * TIERS: starter | growth | scale
 * Each tier has 3 usage levels selectable via dropdown in the UI.
 */

export interface PricingTier {
  /** Monitored sessions per month */
  sessions: number;
  /** Monthly price in USD */
  price: number;
}

export interface PlanFeatures {
  /** Policy rules allowed (null = unlimited) */
  policyRules: number | null;
  /** Team seats (null = unlimited) */
  seats: number | null;
  sessionReplay: boolean;
  forensics: boolean;
  investigations: boolean;
  simulationLab: boolean;
  stressTesting: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  whiteLabel: boolean;
  soc2: boolean;
  selfHosting: boolean;
  customSLA: boolean;
  support: 'email' | 'priority' | 'dedicated';
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  tiers: PricingTier[];
  features: PlanFeatures;
}

export const pricingPlans: Record<string, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'For teams deploying their first AI agent',
    tiers: [
      { sessions: 1000,  price: 49  },
      { sessions: 2500,  price: 89  },
      { sessions: 5000,  price: 149 },
    ],
    features: {
      policyRules:    3,
      seats:          2,
      sessionReplay:  false,
      forensics:      false,
      investigations: false,
      simulationLab:  false,
      stressTesting:  false,
      apiAccess:      true,
      webhooks:       true,
      whiteLabel:     false,
      soc2:           false,
      selfHosting:    false,
      customSLA:      false,
      support:        'email',
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    tagline: 'For fast-moving teams running AI in production',
    tiers: [
      { sessions: 10000,  price: 299 },
      { sessions: 25000,  price: 499 },
      { sessions: 50000,  price: 799 },
    ],
    features: {
      policyRules:    null,
      seats:          10,
      sessionReplay:  true,
      forensics:      true,
      investigations: false,
      simulationLab:  true,
      stressTesting:  false,
      apiAccess:      true,
      webhooks:       true,
      whiteLabel:     false,
      soc2:           false,
      selfHosting:    false,
      customSLA:      false,
      support:        'priority',
    },
  },

  scale: {
    id: 'scale',
    name: 'Scale',
    tagline: 'For enterprises with compliance requirements',
    tiers: [
      { sessions: 100000,  price: 1499 },
      { sessions: 250000,  price: 2499 },
      { sessions: 500000,  price: 3999 },
    ],
    features: {
      policyRules:    null,
      seats:          null,
      sessionReplay:  true,
      forensics:      true,
      investigations: true,
      simulationLab:  true,
      stressTesting:  true,
      apiAccess:      true,
      webhooks:       true,
      whiteLabel:     true,
      soc2:           true,
      selfHosting:    true,
      customSLA:      true,
      support:        'dedicated',
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flat list of all tiers for selectors */
export const getAllTiers = () =>
  Object.values(pricingPlans).flatMap(plan =>
    plan.tiers.map(tier => ({
      id:       `${plan.id}-${tier.sessions}`,
      planId:   plan.id,
      planName: plan.name,
      sessions: tier.sessions,
      /** @deprecated use sessions */
      interactions: tier.sessions,
      price:    tier.price,
    }))
  );

/** Annual price = 20% discount (billed annually) */
export const annualPrice = (monthly: number) => Math.floor(monthly * 0.8);

/** Format session count for display: 1000 → "1k", 50000 → "50k" */
export const fmtSessions = (n: number) =>
  n >= 1_000_000
    ? `${n / 1_000_000}M`
    : n >= 1_000
    ? `${n / 1_000}k`
    : `${n}`;
