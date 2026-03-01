import React from "react";

export default function AlertsFullPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Active Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Governance escalation pipeline · Real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">3 Critical</span>
          <span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">5 Medium</span>
          <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">12 Resolved</span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">ID</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Alert</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Severity</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Channel</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Source</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Status</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold text-right">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-112</td>
                <td className="px-6 py-4 font-medium text-slate-700">Data Exfiltration Risk</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Critical</span></td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Node F-01</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Open</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">2m ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-111</td>
                <td className="px-6 py-4 font-medium text-slate-700">Unsanctioned API Access</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Critical</span></td>
                <td className="px-6 py-4 text-gray-500">Voice</td>
                <td className="px-6 py-4 text-gray-500">Gateway</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Review</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">15m ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-110</td>
                <td className="px-6 py-4 font-medium text-slate-700">Hallucination Spike</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Critical</span></td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">LLM Router</td>
                <td className="px-6 py-4"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Open</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">1h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-109</td>
                <td className="px-6 py-4 font-medium text-slate-700">Policy Override Detected</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Medium</span></td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 6</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Review</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">3h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-108</td>
                <td className="px-6 py-4 font-medium text-slate-700">Behavioral Drift — Anomaly</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Medium</span></td>
                <td className="px-6 py-4 text-gray-500">Voice</td>
                <td className="px-6 py-4 text-gray-500">Monitor</td>
                <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Resolved</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">6h ago</td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">ALT-107</td>
                <td className="px-6 py-4 font-medium text-slate-700">Compliance Drift — SOC2</td>
                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Medium</span></td>
                <td className="px-6 py-4 text-gray-500">Chat</td>
                <td className="px-6 py-4 text-gray-500">Phase 4</td>
                <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Resolved</span></td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs text-right">1d ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
