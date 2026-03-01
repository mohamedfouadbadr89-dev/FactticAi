import React from "react";
import type { InvestigationRow } from "@/lib/dashboard/types";

interface Props {
  data?: InvestigationRow[] | undefined;
}

const statusClass: Record<string, string> = {
  Open: "bg-red-100 text-red-600",
  Review: "bg-amber-100 text-amber-600",
  Closed: "bg-emerald-100 text-emerald-600",
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
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recent Investigations</h3>
          <p className="text-xs text-gray-400 mt-0.5">{rows.filter(r => r.status === "Open").length} Active · {rows.length} Total (30d)</p>
        </div>
        <a href="/dashboard/investigations" className="text-blue-600 text-sm font-medium hover:underline">
          View all →
        </a>
      </div>

      {/* Table */}
      <div className="inv-table">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No investigations found</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">ID</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Investigation Name</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Channel</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Phase</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Status</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">RCA Conf.</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Assigned</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{row.name}</td>
                  <td className="px-6 py-4 text-gray-500">{row.channel}</td>
                  <td className="px-6 py-4 text-gray-500">{row.phase}</td>
                  <td className="px-6 py-4">
                    <span className={`${statusClass[row.status] ?? "bg-gray-100 text-gray-600"} text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono font-bold ${row.rcaColor}`}>{row.rca}</td>
                  <td className="px-6 py-4 text-gray-600">{row.assigned}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
