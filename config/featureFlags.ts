/**
 * Feature Flags Configuration
 * 
 * Empty but structured for Level 1.
 * No hardcoded toggles allowed as per mission rules.
 */

export const featureFlags = {
  // To be populated in subsequent levels
};

export type FeatureFlagKey = keyof typeof featureFlags;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return !!featureFlags[flag];
};
