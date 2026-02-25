/**
 * Risk Color Mapping v1.0
 * 
 * Deterministic visual encoding for risk levels and system status.
 * All colors are tailored for institutional dark mode dashboards.
 */

export const RISK_COLORS = {
  LOW: {
    text: '#10b981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.2)',
    label: 'STABLE'
  },
  MEDIUM: {
    text: '#f59e0b', // amber-500
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    label: 'NEUTRAL'
  },
  HIGH: {
    text: '#f97316', // orange-500
    bg: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.2)',
    label: 'DRIFT_DETECTED'
  },
  CRITICAL: {
    text: '#ef4444', // red-500
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.2)',
    label: 'ALERT'
  }
} as const;

export type RiskLevel = keyof typeof RISK_COLORS;

export const STATUS_COLORS = {
  STABLE: RISK_COLORS.LOW,
  WARNING: RISK_COLORS.MEDIUM,
  DRIFT: RISK_COLORS.HIGH,
  ALERT: RISK_COLORS.CRITICAL,
  CRITICAL: RISK_COLORS.CRITICAL,
  SOVEREIGN: {
    text: '#8b5cf6', // violet-500
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.2)',
    label: 'SOVEREIGN'
  },
  CERTIFIED: {
    text: '#6366f1', // indigo-500
    bg: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.2)',
    label: 'CERTIFIED'
  }
} as const;

export type StatusLevel = keyof typeof STATUS_COLORS;
