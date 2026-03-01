import React from "react";

export default function InvestigationsFullPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Investigations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Root Cause Analysis · Phase 1–6</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">4 Open</span>
          <span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">3 Review</span>
          <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">5 Closed</span>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
        <div className="overflow-x-auto">
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
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-440</td>
                <td className="px-6 py-4 font-medium text-slate-700">Data Exfiltration Risk</td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 3</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Open</span></td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">94%</td>
                <td className="px-6 py-4 text-gray-600">M. Chen</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">2m ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-439</td>
                <td className="px-6 py-4 font-medium text-slate-700">Unsanctioned API Access</td>
                <td className="px-6 py-4 text-gray-500">Voice</td>
                <td className="px-6 py-4 text-gray-500">Phase 5</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Review</span></td>
                <td className="px-6 py-4 font-mono font-bold text-amber-600">78%</td>
                <td className="px-6 py-4 text-gray-600">S. Patel</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">15m ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-438</td>
                <td className="px-6 py-4 font-medium text-slate-700">Hallucination Spike</td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 2</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Open</span></td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">91%</td>
                <td className="px-6 py-4 text-gray-600">R. Kim</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">1h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-437</td>
                <td className="px-6 py-4 font-medium text-slate-700">Policy Override Detected</td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 6</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Open</span></td>
                <td className="px-6 py-4 font-mono font-bold text-amber-600">67%</td>
                <td className="px-6 py-4 text-gray-600">A. Torres</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">3h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-436</td>
                <td className="px-6 py-4 font-medium text-slate-700">Behavioral Drift Anomaly</td>
                <td className="px-6 py-4 text-gray-500">Voice</td>
                <td className="px-6 py-4 text-gray-500">Phase 1</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Review</span></td>
                <td className="px-6 py-4 font-mono font-bold text-amber-600">72%</td>
                <td className="px-6 py-4 text-gray-600">L. Martinez</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">6h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-435</td>
                <td className="px-6 py-4 font-medium text-slate-700">Compliance Drift — SOC2</td>
                <td className="px-6 py-4 text-gray-500">Voice</td>
                <td className="px-6 py-4 text-gray-500">Phase 4</td>
                <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Closed</span></td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">99%</td>
                <td className="px-6 py-4 text-gray-600">J. Liu</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">1d ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">INV-434</td>
                <td className="px-6 py-4 font-medium text-slate-700">Tamper Event — Node C-04</td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 3</td>
                <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Closed</span></td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">97%</td>
                <td className="px-6 py-4 text-gray-600">M. Chen</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">2d ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
