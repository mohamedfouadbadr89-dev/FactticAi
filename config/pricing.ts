/**
 * Facttic Pricing Configuration
 * 
 * CORE PRINCIPLE: Centralized Tier Management.
 * This file defines all available plans, usage tiers, and price mappings.
 * It is consumed by both the Billing API and the Pricing UI.
 */

export interface PricingTier {
  interactions: number;
  price: number;
}

export interface PricingPlan {
  name: string;
  tiers: PricingTier[];
}

export const pricingConfig: Record<string, PricingPlan> = {
  starter: {
    name: "Starter",
    tiers: [
      { interactions: 10000, price: 39 },
      { interactions: 25000, price: 59 },
      { interactions: 50000, price: 79 }
    ]
  },
  growth: {
    name: "Growth",
    tiers: [
      { interactions: 50000, price: 129 },
      { interactions: 100000, price: 179 },
      { interactions: 250000, price: 249 }
    ]
  },
  scale: {
    name: "Scale",
    tiers: [
      { interactions: 200000, price: 349 },
      { interactions: 500000, price: 499 },
      { interactions: 1000000, price: 799 }
    ]
  }
};

/**
 * Helper to get all tiers flat for UI selectors
 */
export const getAllTiers = () => {
  return Object.entries(pricingConfig).flatMap(([planId, plan]) => 
    plan.tiers.map(tier => ({
      id: `${planId}-${tier.interactions}`,
      planId,
      planName: plan.name,
      ...tier
    }))
  );
};
