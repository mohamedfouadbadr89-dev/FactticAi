/**
 * TierPriority (v1.0.0)
 * Defines structural hierarchy for Enterprise Dashboard.
 */

export enum DashboardTier {
  T1_CRITICAL = 1,
  T2_ANALYTICAL = 2,
  T3_OPERATIONAL = 3,
  T4_INFORMATIONAL = 4
}

export const TIER_SPANS: Record<DashboardTier, 3 | 4 | 6 | 12> = {
  [DashboardTier.T1_CRITICAL]: 12,
  [DashboardTier.T2_ANALYTICAL]: 6,
  [DashboardTier.T3_OPERATIONAL]: 4,
  [DashboardTier.T4_INFORMATIONAL]: 3
};

export interface PanelConfig {
  id: string;
  tier: DashboardTier;
  title: string;
}

export const EXECUTIVE_PANELS: PanelConfig[] = [
  { id: 'gov-health', tier: DashboardTier.T1_CRITICAL, title: 'Governance Health' },
  { id: 'risk-level', tier: DashboardTier.T1_CRITICAL, title: 'Active Risk Level' },
  { id: 'drift-30d', tier: DashboardTier.T2_ANALYTICAL, title: '30-Day Drift' },
  { id: 'isolation', tier: DashboardTier.T3_OPERATIONAL, title: 'Isolation Integrity' },
  { id: 'sovereignty', tier: DashboardTier.T3_OPERATIONAL, title: 'Region Sovereignty' }
];

export const TECHNICAL_PANELS: PanelConfig[] = [
  { id: 'telemetry', tier: DashboardTier.T1_CRITICAL, title: 'Governance Pipeline Telemetry' },
  { id: 'determinism-log', tier: DashboardTier.T2_ANALYTICAL, title: 'Determinism Log' },
  { id: 'billing-integrity', tier: DashboardTier.T3_OPERATIONAL, title: 'Billing Integrity' },
  { id: 'failover-status', tier: DashboardTier.T3_OPERATIONAL, title: 'Failover Status' }
];
