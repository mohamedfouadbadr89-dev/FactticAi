import React from "react";
import type { InvestigationRow } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";

interface Props {
  data?: InvestigationRow[] | undefined;
}

const statusClass: Record<string, string> = {
  Open: "bg-[var(--danger-bg)] text-[var(--danger)] animate-breathe",
  Review: "bg-[var(--warning-bg)] text-[var(--warning)]",
  Closed: "bg-[var(--success-bg)] text-[var(--success)]",
};

const defaultRows: InvestigationRow[] = [
  { id: "INV-440", name: "Data Exfiltration Risk", channel: "Chat", phase: "Phase 3", status: "Open", rca: "94%", rcaColor: "text-emerald-600", assigned: "M. Chen", updated: "2m ago" },
  { id: "INV-439", name: "Unsanctioned API Access", channel: "Voice", phase: "Phase 5", status: "Review", rca: "78%", rcaColor: "text-amber-600", assigned: "S. Patel", updated: "15m ago" },
  { id: "INV-438", name: "Hallucination Spike", channel: "Chat", phase: "Phase 2", status: "Open", rca: "91%", rcaColor: "text-emerald-600", assigned: "R. Kim", updated: "1h ago" },
  { id: "INV-437", name: "Policy Override Detected", channel: "Chat", phase: "Phase 6", status: "Open", rca: "67%", rcaColor: "text-amber-600", assigned: "A. Torres", updated: "3h ago" },
  { id: "INV-435", name: "Compliance Drift — SOC2", channel: "Voice", phase: "Phase 4", status: "Closed", rca: "99%", rcaColor: "text-emerald-600", assigned: "J. Liu", updated: "1d ago" },
];

export default function RecentInvestigationsCard({ data }: Props) {
  const rows = data ?? defaultRows;

  return (
    <div className="card overflow-hidden animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="card-title">Recent Investigations</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{rows.filter(r => r.status === "Open").length} Active · {rows.length} Total (30d)</p>
        </div>
        <a href="/dashboard/investigations" className="text-[var(--accent)] text-sm font-medium hover:underline">
          View all →
        </a>
      </div>

      {/* Table */}
      <div className="inv-table">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">No investigations found</div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-[var(--bg-primary)]">
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">ID</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Investigation Name</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Channel</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Phase</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Status</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">RCA Conf.</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Assigned</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[13px] text-[var(--text-secondary)]">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFBFC] transition-colors duration-150">
                  <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                  <td className="px-6 py-4">{row.channel}</td>
                  <td className="px-6 py-4">{row.phase}</td>
                  <td className="px-6 py-4">
                    <span className={`${statusClass[row.status] ?? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"} text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono font-medium ${row.rcaColor}`}><CountUp value={parseFloat(row.rca)} />%</td>
                  <td className="px-6 py-4 text-[var(--text-primary)]">{row.assigned}</td>
                  <td className="px-6 py-4 font-mono text-right">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
