import React from "react";

const heatmapData = [
  { agent: "Agent A", days: [0.1, 0.3, 0.8, 0.2, 0.5, 1.2, 0.4] },
  { agent: "Agent B", days: [0.2, 0.1, 0.3, 0.6, 0.2, 0.1, 0.3] },
  { agent: "Agent C", days: [1.4, 0.9, 0.7, 0.5, 0.8, 1.1, 0.6] },
  { agent: "Agent D", days: [0.1, 0.1, 0.2, 0.1, 0.1, 0.3, 0.1] },
  { agent: "Agent E", days: [0.6, 0.8, 1.0, 1.3, 0.9, 0.7, 0.5] },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function heatColor(val: number): string {
  if (val >= 1.0) return "bg-red-200 text-red-700";
  if (val >= 0.5) return "bg-amber-100 text-amber-700";
  if (val >= 0.2) return "bg-blue-50 text-blue-600";
  return "bg-gray-50 text-gray-400";
}

export default function AdvancedModePage() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Advanced Mode
        </h1>
        <p className="text-sm text-gray-500 mt-1">Deep diagnostics · Model telemetry · Escalation analysis</p>
      </div>

      {/* Row 1: Drift Heatmap + Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Drift Heatmap */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Drift Heatmap</h3>
              <p className="text-xs text-gray-400 mt-0.5">7-day agent deviation grid</p>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">Last 7 Days</span>
          </div>
          <div className="p-6">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-400" />
              {weekDays.map((d) => (
                <div key={d} className="text-[10px] uppercase tracking-widest text-gray-400 text-center">{d}</div>
              ))}
            </div>
            {/* Data Rows */}
            {heatmapData.map((row) => (
              <div key={row.agent} className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-medium text-slate-700 flex items-center">{row.agent}</div>
                {row.days.map((val, i) => (
                  <div
                    key={i}
                    className={`rounded-md text-center py-2 text-[11px] font-mono font-bold ${heatColor(val)}`}
                  >
                    {val.toFixed(1)}%
                  </div>
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[10px] uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />Normal</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />Elevated</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-300" />Critical</span>
            </div>
          </div>
        </div>

        {/* Root Cause Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Root Cause Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Top attribution factors · 30d</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Prompt Injection Attempt", pct: 34, color: "bg-red-500" },
              { label: "Context Window Overflow", pct: 22, color: "bg-amber-500" },
              { label: "Hallucination — Factual", pct: 18, color: "bg-blue-500" },
              { label: "Policy Boundary Violation", pct: 14, color: "bg-indigo-500" },
              { label: "Latency Degradation", pct: 8, color: "bg-slate-400" },
              { label: "Unknown / Other", pct: 4, color: "bg-gray-300" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{item.pct}%</span>
                </div>
                <div className="h-2 rounded bg-gray-200 overflow-hidden">
                  <div className={`h-full rounded ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Model Confidence + Escalation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Model Confidence Distribution */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Model Confidence Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Response certainty histogram · 24h</p>
          </div>
          <div className="p-6">
            {/* Bar Chart */}
            <div className="flex items-end gap-2 h-40 mb-4">
              {[
                { range: "0–20", count: 3, pct: 7.5 },
                { range: "20–40", count: 8, pct: 20 },
                { range: "40–60", count: 15, pct: 37.5 },
                { range: "60–80", count: 42, pct: 100 },
                { range: "80–90", count: 38, pct: 90 },
                { range: "90–95", count: 28, pct: 67 },
                { range: "95–100", count: 12, pct: 28.5 },
              ].map((bar) => (
                <div key={bar.range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-slate-600">{bar.count}</span>
                  <div
                    className="w-full bg-blue-500/80 rounded-t-md transition-all duration-300"
                    style={{ height: `${bar.pct}%`, minHeight: "4px" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {["0–20", "20–40", "40–60", "60–80", "80–90", "90–95", "95–100"].map((r) => (
                <div key={r} className="flex-1 text-center text-[9px] font-mono text-gray-400">{r}%</div>
              ))}
            </div>
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Median</div>
                <div className="text-lg font-bold text-slate-900">74.2%</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">P95</div>
                <div className="text-lg font-bold text-emerald-600">96.8%</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Below Threshold</div>
                <div className="text-lg font-bold text-amber-600">11</div>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Flow */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Escalation Flow</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pipeline stage distribution · 30d</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { stage: "Input Capture", count: 12847, status: "ok" },
              { stage: "Agent Routing", count: 12841, status: "ok" },
              { stage: "Drift Detection", count: 428, status: "warn" },
              { stage: "RCA Analysis", count: 127, status: "warn" },
              { stage: "Escalation Trigger", count: 23, status: "alert" },
              { stage: "Human Review", count: 8, status: "alert" },
              { stage: "Resolution", count: 5, status: "ok" },
            ].map((item, idx) => (
              <React.Fragment key={item.stage}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    item.status === "ok" ? "bg-emerald-50 text-emerald-600" :
                    item.status === "warn" ? "bg-amber-50 text-amber-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">{item.stage}</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900">{item.count.toLocaleString()}</div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    item.status === "ok" ? "bg-emerald-100 text-emerald-600" :
                    item.status === "warn" ? "bg-amber-100 text-amber-600" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {item.status === "ok" ? "Normal" : item.status === "warn" ? "Elevated" : "Critical"}
                  </div>
                </div>
                {idx < 6 && (
                  <div className="ml-4 h-4 border-l-2 border-dashed border-slate-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Live Evaluation Logs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Evaluation Logs</h3>
            <p className="text-xs text-gray-400 mt-0.5">Real-time model evaluation trace</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Streaming
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Timestamp</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Trace ID</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Agent</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Evaluation</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Confidence</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold">Latency</th>
                <th className="px-6 py-3 text-xs uppercase text-gray-400 tracking-wider font-semibold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:22:14.882</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-8A4F</td>
                <td className="px-6 py-4 text-gray-600">Agent A</td>
                <td className="px-6 py-4 text-gray-500">Factual Grounding</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">97.2%</td>
                <td className="px-6 py-4 font-mono text-gray-500">124ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Pass</span></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:22:12.441</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-7B3E</td>
                <td className="px-6 py-4 text-gray-600">Agent C</td>
                <td className="px-6 py-4 text-gray-500">Policy Compliance</td>
                <td className="px-6 py-4 font-mono font-bold text-amber-600">68.4%</td>
                <td className="px-6 py-4 font-mono text-gray-500">342ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-amber-100 text-amber-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Warn</span></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:22:09.107</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-6C2D</td>
                <td className="px-6 py-4 text-gray-600">Agent B</td>
                <td className="px-6 py-4 text-gray-500">Drift Check</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">94.1%</td>
                <td className="px-6 py-4 font-mono text-gray-500">89ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Pass</span></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:22:06.553</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-5D1C</td>
                <td className="px-6 py-4 text-gray-600">Agent E</td>
                <td className="px-6 py-4 text-gray-500">Hallucination Guard</td>
                <td className="px-6 py-4 font-mono font-bold text-red-600">42.7%</td>
                <td className="px-6 py-4 font-mono text-gray-500">512ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-red-100 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Fail</span></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:22:03.219</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-4E0B</td>
                <td className="px-6 py-4 text-gray-600">Agent D</td>
                <td className="px-6 py-4 text-gray-500">Input Sanitization</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">99.1%</td>
                <td className="px-6 py-4 font-mono text-gray-500">67ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Pass</span></td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">03:21:59.887</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">TRC-3F9A</td>
                <td className="px-6 py-4 text-gray-600">Agent A</td>
                <td className="px-6 py-4 text-gray-500">Context Integrity</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">91.3%</td>
                <td className="px-6 py-4 font-mono text-gray-500">156ms</td>
                <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Pass</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
