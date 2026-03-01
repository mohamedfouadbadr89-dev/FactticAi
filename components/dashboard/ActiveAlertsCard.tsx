import React from "react";
import type { AlertItem } from "@/lib/dashboard/types";

interface Props {
  data?: AlertItem[] | undefined;
}

const severityClass: Record<string, string> = {
  High: "bg-red-100 text-red-600",
  Med: "bg-amber-100 text-amber-600",
  Low: "bg-emerald-100 text-emerald-600",
};

export default function ActiveAlertsCard({ data }: Props) {
  const alerts = data ?? [
    { id: "INV-440", title: "Data Exfiltration Risk", description: "Outbound payload exceeded threshold on Node F-01", meta: "INV-440 · 2m ago · Chat", severity: "High" as const },
    { id: "INV-439", title: "Unsanctioned API Access", description: "Unauthorized endpoint call detected at gateway layer", meta: "INV-439 · 15m ago · Voice", severity: "Med" as const },
    { id: "INV-438", title: "Hallucination Spike", description: "LLM router confidence dropped below safe threshold", meta: "INV-438 · 1h ago · Chat", severity: "High" as const },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Active Alerts</h3>
        <span className="bg-red-50 text-red-600 rounded-full px-3 py-1 text-xs font-medium">
          {alerts.length} Open
        </span>
      </div>

      {/* Body */}
      <div className="px-6">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No active alerts</div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={alert.id}
              className={`flex justify-between items-start py-4 ${idx < alerts.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div>
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{alert.description}</p>
                <p className="text-xs text-gray-400 mt-1">{alert.meta}</p>
              </div>
              <span className={`${severityClass[alert.severity] ?? "bg-gray-100 text-gray-600"} text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ml-4`}>
                {alert.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
