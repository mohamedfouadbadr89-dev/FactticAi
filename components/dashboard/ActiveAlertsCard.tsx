import React from "react";
import type { AlertItem } from "@/lib/dashboard/types";

interface Props {
  data?: AlertItem[] | undefined;
}

const severityClass: Record<string, string> = {
  High: "bg-[var(--danger-bg)] text-[var(--danger)] animate-breathe",
  Med: "bg-[var(--warning-bg)] text-[var(--warning)]",
  Low: "bg-[var(--success-bg)] text-[var(--success)]",
};

const rowInteractionClass: Record<string, string> = {
  High: "border border-[var(--danger)] animate-pulse-border hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] rounded-lg relative z-10 bg-[var(--bg-primary)]",
  Med: "hover:shadow-[0_0_15px_rgba(217,119,6,0.1)] transition-shadow duration-300 rounded-lg",
  Low: "hover:bg-[var(--bg-secondary)] transition-colors duration-200 rounded-lg",
};

export default function ActiveAlertsCard({ data }: Props) {
  const alerts = data ?? [
    { id: "INV-440", title: "Data Exfiltration Risk", description: "Outbound payload exceeded threshold on Node F-01", meta: "INV-440 · 2m ago · Chat", severity: "High" as const },
    { id: "INV-439", title: "Unsanctioned API Access", description: "Unauthorized endpoint call detected at gateway layer", meta: "INV-439 · 15m ago · Voice", severity: "Med" as const },
    { id: "INV-438", title: "Hallucination Spike", description: "LLM router confidence dropped below safe threshold", meta: "INV-438 · 1h ago · Chat", severity: "High" as const },
  ];

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <h3 className="card-title">Active Alerts</h3>
        <span className="bg-[var(--danger-bg)] text-[var(--danger)] rounded-full px-3 py-1 text-xs font-medium">
          {alerts.length} Open
        </span>
      </div>

      {/* Body */}
      <div className="px-6">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">No active alerts</div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={alert.id}
              className={`flex justify-between items-start py-4 px-3 -mx-3 mb-1 ${rowInteractionClass[alert.severity] ?? "hover:bg-[var(--bg-secondary)] transition-colors duration-200"} ${
                idx < alerts.length - 1 && alert.severity !== "High" && alert.severity !== "Med" ? "border-b border-[var(--border-primary)]" : ""
              }`}
              style={alert.severity === "High" ? { "--pulse-color": "rgba(220, 38, 38, 0.4)" } as React.CSSProperties : {}}
            >
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{alert.title}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{alert.description}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{alert.meta}</p>
              </div>
              <span className={`${severityClass[alert.severity] ?? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"} text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px] shrink-0 ml-4`}>
                {alert.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
