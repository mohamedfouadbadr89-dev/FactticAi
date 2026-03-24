"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AlertItem } from "@/lib/dashboard/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const PAGE_SIZE = 3;

export default function ActiveAlertsCard({ data }: Props) {
  const router = useRouter();
  const alerts = data ?? [];

  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE));
  const pageAlerts = alerts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card animate-[fadeIn_.4s_ease-in-out] flex flex-col">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/alerts')} className="card-title hover:text-[var(--accent)] transition-colors text-left">Active Alerts</button>
        <span
          className="bg-[var(--danger-bg)] text-[var(--danger)] rounded-full px-3 py-1 text-xs font-medium cursor-pointer"
          onClick={() => router.push('/dashboard/alerts')}
        >
          {alerts.length} Open
        </span>
      </div>

      {/* Body */}
      <div className="px-6 flex-1">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">No active alerts</div>
        ) : (
          pageAlerts.map((alert, idx) => (
            <div
              key={alert.id}
              onClick={() => router.push('/dashboard/alerts')}
              className={`flex justify-between items-start py-4 px-3 -mx-3 mb-1 cursor-pointer ${rowInteractionClass[alert.severity] ?? "hover:bg-[var(--bg-secondary)] transition-colors duration-200"} ${
                idx < pageAlerts.length - 1 && alert.severity !== "High" && alert.severity !== "Med" ? "border-b border-[var(--border-primary)]" : ""
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-[var(--border-color)] flex items-center justify-between mt-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, alerts.length)} of {alerts.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
