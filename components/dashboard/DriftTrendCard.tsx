import React from "react";
import type { DriftData } from "@/lib/dashboard/types";

interface Props {
  data?: DriftData | undefined;
}

export default function DriftTrendCard({ data }: Props) {
  const d = data ?? { current: "2.4%", avg_30d: "1.8%", baseline: "0.9%" };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">

      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Drift Trend — 30 Days
          </h3>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Behavioral deviation · Chat + Voice
          </p>
        </div>
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-bold font-mono uppercase tracking-widest">
          <button className="px-3 py-1.5 text-slate-400 rounded-l-lg">7D</button>
          <button className="px-3 py-1.5 bg-gray-100 text-slate-800 border-x border-slate-200">30D</button>
          <button className="px-3 py-1.5 text-slate-400 rounded-r-lg">90D</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-8 pt-6 flex items-center gap-10">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">Current</div>
          <div className="text-2xl font-black font-serif text-amber-600">{d.current}</div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">30d Avg</div>
          <div className="text-lg font-bold font-mono text-gray-500">{d.avg_30d}</div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">Baseline</div>
          <div className="text-lg font-bold font-mono text-emerald-600">{d.baseline}</div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-8 py-6">
        <svg viewBox="0 0 600 160" className="w-full h-40" preserveAspectRatio="none">
          <line x1="0" y1="40" x2="600" y2="40" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2="600" y2="80" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="120" x2="600" y2="120" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="160" x2="600" y2="160" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="0" y1="130" x2="600" y2="130" stroke="#10B981" strokeWidth="1" strokeDasharray="6 3" />
          <path
            d="M 0,140 L 40,135 80,128 120,120 160,110 200,100 240,95 280,88 320,82 360,75 400,70 440,65 480,58 520,55 560,48 600,45 L 600,160 L 0,160 Z"
            fill="url(#driftAreaGrad)"
          />
          <polyline
            points="0,140 40,135 80,128 120,120 160,110 200,100 240,95 280,88 320,82 360,75 400,70 440,65 480,58 520,55 560,48 600,45"
            fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="360" cy="75" r="5" fill="#EF4444" />
          <circle cx="360" cy="75" r="8" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.4" />
          <defs>
            <linearGradient id="driftAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Footer Legend */}
      <div className="px-8 pb-5 flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-600 rounded" />
          Drift Freq
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-emerald-500 rounded" />
          Baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Alert
        </span>
      </div>

    </div>
  );
}
