/**
 * Facttic Synthetic Demo Dataset (v1.0)
 * 
 * CORE PRINCIPLE: Deterministic Fallback for Demo Environments.
 * This file provides the "Ground Truth" for dashboards when real telemetry is absent.
 */

export const demoSignals = {
  interactions: 1200,
  violations: 42,
  guardrails: 11,
  alerts: 6,
  incidents: 2,
  riskTrend: [
    { time: "21:00", hour: -24, score: 14 },
    { time: "03:00", hour: -18, score: 22 },
    { time: "09:00", hour: -12, score: 31 },
    { time: "15:00", hour: -6, score: 18 },
    { time: "18:00", hour: -3, score: 12 },
    { time: "21:00", hour: 0, score: 15 } // Current
  ],
  // Breakdown for advanced observability
  observability: {
    risk_latency: { avg_ms: 124, p95_ms: 280 },
    drift_propagation: { correlation_coefficient: 0.84, spike_incidents: 3 },
    alert_frequency: {
      total: 6,
      by_type: {
        "policy_violation": 3,
        "pii_leakage": 2,
        "hallucination": 1
      },
      hourly_distribution: [2, 0, 1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]
    }
  }
};
