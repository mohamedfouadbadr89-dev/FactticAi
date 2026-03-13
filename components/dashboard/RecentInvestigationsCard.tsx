"use client";

import React, { useState } from "react";
import type { InvestigationRow } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const PAGE_SIZE = 5;

export default function RecentInvestigationsCard({ data }: Props) {
  const rows = data ?? defaultRows;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold col-phase">Channel</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold col-phase">Phase</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">Status</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold">RCA Conf.</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold col-assigned">Assigned</th>
                <th className="px-6 py-3 text-[10px] tracking-[1.5px] uppercase text-[var(--text-muted)] font-semibold text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[13px] text-[var(--text-secondary)]">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--bg-secondary)] transition-colors duration-150">
                  <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                  <td className="px-6 py-4 col-phase">{row.channel}</td>
                  <td className="px-6 py-4 col-phase">{row.phase}</td>
                  <td className="px-6 py-4">
                    <span className={`${statusClass[row.status] ?? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"} text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-[20px]`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono font-medium ${row.rcaColor}`}><CountUp value={parseFloat(row.rca)} />%</td>
                  <td className="px-6 py-4 text-[var(--text-primary)] col-assigned">{row.assigned}</td>
                  <td className="px-6 py-4 font-mono text-right">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                  i === page
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
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
