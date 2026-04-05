"use client";

import { useState, useEffect, useMemo } from "react";
import type { DashboardData } from "./types";
import { useSimulationState } from "./SimulationContext";
const FALLBACK: DashboardData | null = null;

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(endpoint?: string): UseDashboardResult {
  const [baseData, setBaseData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSimulating, simulationStep } = useSimulationState();

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
