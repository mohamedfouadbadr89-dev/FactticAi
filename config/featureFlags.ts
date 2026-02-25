export const featureFlags = {
  PER_ORG_RATE_LIMITS: true,
  SESSION_RETENTION_PRUNING: true,
  WEBHOOK_RETRY_QUEUE: true,
  AI_CIRCUIT_BREAKER: true,
  REDIS_CACHE_LAYER: true,
  PREDICTIVE_GOVERNANCE_ACTIVE: true,
  DEMO_AUTO_PROVISION_ENABLED: true,
  DEPLOYMENT_GUARD: true,
};

export type FeatureFlagKey = keyof typeof featureFlags;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return !!featureFlags[flag];
};
