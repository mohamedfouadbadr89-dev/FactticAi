"use client";

import React from 'react';

interface HeatmapData {
  modelA: string;
  modelB: string;
  score: number;
}

const MOCK_DATA: HeatmapData[] = [
  { modelA: 'GPT-4o', modelB: 'Claude 3.5 Opus', score: 0.82 },
  { modelA: 'GPT-4o', modelB: 'Gemini 1.5 Pro', score: 0.75 },
  { modelA: 'GPT-4o', modelB: 'Llama 3 70B', score: 0.91 },
  { modelA: 'Claude 3.5 Opus', modelB: 'Gemini 1.5 Pro', score: 0.68 },
  { modelA: 'Claude 3.5 Opus', modelB: 'Llama 3 70B', score: 0.84 },
  { modelA: 'Gemini 1.5 Pro', modelB: 'Llama 3 70B', score: 0.72 },
];

export function ConsistencyHeatmap() {
  const models = ['GPT-4o', 'Claude 3.5 Opus', 'Gemini 1.5 Pro', 'Llama 3 70B'];

  const getScore = (mA: string, mB: string) => {
    if (mA === mB) return 1.0;
    const match = MOCK_DATA.find(d => 
      (d.modelA === mA && d.modelB === mB) || (d.modelA === mB && d.modelB === mA)
    );
    return match ? match.score : 0;
  };

  const getColor = (score: number) => {
    if (score >= 0.9) return 'bg-emerald-500/80';
    if (score >= 0.8) return 'bg-emerald-500/40 text-emerald-200';
    if (score >= 0.7) return 'bg-amber-500/40 text-amber-200';
    return 'bg-rose-500/40 text-rose-200';
  };

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 italic tracking-tight">Behavioral Parity Heatmap</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Cross-Model Semantic Consistency</p>
        </div>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500" />
           <div className="w-2 h-2 rounded-full bg-amber-500 opacity-50" />
           <div className="w-2 h-2 rounded-full bg-rose-500 opacity-50" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {models.map(m => (
                <th key={m} className="p-2 text-slate-500 font-medium text-left truncate max-w-[80px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map(rowModel => (
              <tr key={rowModel}>
                <td className="p-2 text-slate-500 font-medium whitespace-nowrap">{rowModel}</td>
                {models.map(colModel => {
                  const score = getScore(rowModel, colModel);
                  return (
                    <td key={`${rowModel}-${colModel}`} className="p-1">
                      <div className={`h-12 flex items-center justify-center rounded-lg font-mono text-[10px] ${getColor(score)} transition-all hover:scale-105 cursor-pointer`}>
                        {(score * 100).toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-[10px] text-slate-500 uppercase font-mono border-t border-slate-800/50 pt-4">
        <span>Metric: Cosine Similarity</span>
        <span>Confidence: 99.2%</span>
      </div>
    </div>
  );
}
