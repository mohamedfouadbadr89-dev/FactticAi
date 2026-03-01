/**
 * FACTTIC FEATURE FLAG SYSTEM v1.0
 * DO NOT REMOVE FLAGS WITHOUT ARCHITECTURAL REVIEW
 */

export const featureFlags = {
  voiceGovernance: false,
  advancedIntelligence: false,
  billingForecast: false,
  complianceLayer: false,
  sandboxChat: true,
  alerts: true,
  investigations: true,
  driftEngine: true,
  governanceComposite: true,
  securityLayer: true,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * Checks if a feature is enabled.
 * Priority: 
 * 1. Process Environment Variable (NEXT_PUBLIC_FLAG_NAME)
 * 2. Hardcoded Default
 */
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  const envKey = `NEXT_PUBLIC_${flag.toUpperCase()}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    return envValue === 'true';
  }

  return featureFlags[flag];
};
