/* ─── Dashboard Data Types ─── */

export interface HealthData {
  governance_score: number;
  sessions_today: number;
  voice_calls: number;
  drift_freq: string;
  rca_confidence: string;
  policy_adherence: string;
  behavioral_drift: string;
  open_alerts: number;
  tamper_integrity: string;
  avg_risk_24h?: number | string;
}

export interface DriftData {
  current: string;
  avg_30d?: string;
  avg_period?: string;
  baseline: string;
  history?: any[];
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  severity: "High" | "Med" | "Low";
}

export interface RiskMetric {
  label: string;
  value: string;
  percent: number;
  color: string;
  barColor: string;
}

export interface InvestigationRow {
  id: string;
  name: string;
  channel: string;
  phase: string;
  status: "Open" | "Review" | "Closed";
  rca: string;
  rcaColor: string;
  assigned: string;
  updated: string;
}

export interface DashboardData {
  health: HealthData;
  drift: DriftData;
  alerts: AlertItem[];
  risks: RiskMetric[];
  investigations: InvestigationRow[];
  voice_drift?: {
    avg_risk_30d: number;
    percentage_change: number;
    trend: number[];
  };
  intelligence?: {
    pii_exposed_today: number;
    compliance_drift_score: number;
    recent_violations: { id: string; type: string; timestamp: string; }[];
    pii_trend: number[];
    drift_alerts?: number;
    model_count?: number;
  };
  // V1 Product Metrics (Phase 56)
  health_score?: number;
  risk_level?: "low" | "moderate" | "high" | "critical";
  metrics?: any;
  governance?: {
    blocked_responses: number;
    total_intercepts: number;
    policy_violations: number;
  };
  gateway?: {
    total_requests: number;
    active_providers: number;
  };
  agents?: {
    active_agents: number;
    total_steps: number;
    incidents: number;
  };
}
