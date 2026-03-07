"use client";

import { useState, useEffect, useMemo } from "react";
import type { DashboardData } from "./types";
import { useSimulation } from "./SimulationContext";
import { demoSignals } from "../demo/demoSignals";

/* ─── Default fallback data (matches current static UI) ─── */
const FALLBACK: DashboardData = {
  health: {
    governance_score: 84,
    sessions_today: demoSignals.interactions,
    voice_calls: 87,
    drift_freq: "2.4%",
    rca_confidence: "91%",
    policy_adherence: "96.2% compliant",
    behavioral_drift: "Monitor",
    open_alerts: demoSignals.alerts,
    tamper_integrity: "Verified",
  },
  drift: {
    current: "2.4%",
    avg_30d: "1.8%",
    baseline: "0.9%",
  },
  alerts: [
    { id: "INV-440", title: "Data Exfiltration Risk", description: "Outbound payload exceeded threshold on Node F-01", meta: "INV-440 · 2m ago · Chat", severity: "High" },
    { id: "INV-439", title: "Unsanctioned API Access", description: "Unauthorized endpoint call detected at gateway layer", meta: "INV-439 · 15m ago · Voice", severity: "Med" },
    { id: "INV-438", title: "Hallucination Spike", description: "LLM router confidence dropped below safe threshold", meta: "INV-438 · 1h ago · Chat", severity: "High" },
  ],
  risks: [
    { label: "Policy Adherence", value: "96.2%", percent: 96.2, color: "text-emerald-700", barColor: "bg-emerald-500" },
    { label: "Behavioral Drift", value: "2.4%", percent: 2.4, color: "text-amber-700", barColor: "bg-amber-500" },
    { label: "Tamper Events", value: "0", percent: 100, color: "text-emerald-700", barColor: "bg-emerald-500" },
    { label: "RCA Confidence", value: "91%", percent: 91, color: "text-blue-700", barColor: "bg-blue-500" },
    { label: "Escalation Rate", value: "0.7%", percent: 0.7, color: "text-emerald-700", barColor: "bg-emerald-500" },
    { label: "Open Investigations", value: "4", percent: 40, color: "text-amber-700", barColor: "bg-amber-500" },
  ],
  investigations: [
    { id: "INV-440", name: "Data Exfiltration Risk", channel: "Chat", phase: "Phase 3", status: "Open", rca: "94%", rcaColor: "text-emerald-600", assigned: "M. Chen", updated: "2m ago" },
    { id: "INV-439", name: "Unsanctioned API Access", channel: "Voice", phase: "Phase 5", status: "Review", rca: "78%", rcaColor: "text-amber-600", assigned: "S. Patel", updated: "15m ago" },
    { id: "INV-438", name: "Hallucination Spike", channel: "Chat", phase: "Phase 2", status: "Open", rca: "91%", rcaColor: "text-emerald-600", assigned: "R. Kim", updated: "1h ago" },
    { id: "INV-437", name: "Policy Override Detected", channel: "Chat", phase: "Phase 6", status: "Open", rca: "67%", rcaColor: "text-amber-600", assigned: "A. Torres", updated: "3h ago" },
    { id: "INV-435", name: "Compliance Drift — SOC2", channel: "Voice", phase: "Phase 4", status: "Closed", rca: "99%", rcaColor: "text-emerald-600", assigned: "J. Liu", updated: "1d ago" },
  ],
  intelligence: {
    pii_exposed_today: demoSignals.violations,
    compliance_drift_score: 0.18,
    recent_violations: [
      { id: "V-001", type: "EMAIL_EXPOSURE", timestamp: "10:45 AM" },
      { id: "V-002", type: "SSN_DETECTED", timestamp: "09:12 AM" }
    ],
    pii_trend: [4, 6, 3, 8, 12, 10, 14, 12, 11, 13, 15, 12, 11, 10, 12]
  }
};

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(endpoint?: string): UseDashboardResult {
  const [baseData, setBaseData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSimulating, simulationStep } = useSimulation();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (endpoint) {
          const res = await fetch(endpoint);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!cancelled) {
            // Support both direct DashboardData or { success, data: DashboardData }
            setBaseData(json.data || json);
          }
        } else {
          // No endpoint configured — use fallback data
          await new Promise((r) => setTimeout(r, 300));
          if (!cancelled) setBaseData(FALLBACK);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setBaseData(FALLBACK); // graceful degradation
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [endpoint]);

  // Apply simulation overlay
  const dataview = useMemo(() => {
    if (!baseData) return null;
    if (!isSimulating || simulationStep === 0) return baseData;

    // Deep clone to safely mutate
    const m = JSON.parse(JSON.stringify(baseData)) as DashboardData;

    // Step 1: Increase Drift +1.2%
    if (simulationStep >= 1) {
      m.drift.current = "3.6%"; // 2.4 + 1.2
      m.drift.avg_30d = "1.9%";
      
      const driftRisk = m.risks.find(r => r.label === "Behavioral Drift");
      if (driftRisk) {
        driftRisk.value = "3.6%";
        driftRisk.percent = 3.6;
        driftRisk.color = "text-danger";
        driftRisk.barColor = "bg-[var(--danger)]";
      }
    }

    // Step 2: Add new High alert
    if (simulationStep >= 2) {
      m.alerts.unshift({
        id: "INV-501",
        title: "[SIMULATED] Unauthorized PII Access",
        description: "Agent bypassed anonymization layer reading raw SSN logs",
        meta: "INV-501 · Just now · Automated",
        severity: "High"
      });
      m.health.open_alerts += 1;
    }

    // Step 3: Decrease Governance Score by 4 points
    if (simulationStep >= 3) {
      m.health.governance_score -= 4;
      m.health.tamper_integrity = "Warning";
      
      const tamperRisk = m.risks.find(r => r.label === "Tamper Events");
      if (tamperRisk) {
        tamperRisk.value = "1";
        tamperRisk.percent = 15;
        tamperRisk.color = "text-danger";
        tamperRisk.barColor = "bg-[var(--danger)]";
      }
    }

    // Step 4: Increase RCA confidence slightly & add Investigation
    if (simulationStep >= 4) {
      m.health.rca_confidence = "94%";
      
      const rcaRisk = m.risks.find(r => r.label === "RCA Confidence");
      if (rcaRisk) {
        rcaRisk.value = "94%";
        rcaRisk.percent = 94;
      }
      
      m.investigations.unshift({
        id: "INV-501",
        name: "[SIM] PII Access Violation",
        channel: "Automated",
        phase: "Phase 1",
        status: "Open",
        rca: "98%",
        rcaColor: "text-emerald-600",
        assigned: "Auto-Triage",
        updated: "Just now"
      });
    }

    return m;
  }, [baseData, isSimulating, simulationStep]);

  return { data: dataview, loading, error };
}
