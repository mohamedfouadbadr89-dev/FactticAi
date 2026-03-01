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
}

export interface DriftData {
  current: string;
  avg_30d: string;
  baseline: string;
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
}
