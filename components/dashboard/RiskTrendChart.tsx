"use client";

import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { demoSignals } from '@/lib/demo/demoSignals';

interface RiskTrendChartProps {
  data: any[];
  loading: boolean;
}

export default function RiskTrendChart({ data, loading }: RiskTrendChartProps) {
  const chartData = (data && data.length > 0) ? data : demoSignals.riskTrend;

  if (loading && (!data || data.length === 0)) return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-3xl p-8 h-[300px] flex items-center justify-center border-dashed">
      <div className="text-center grayscale opacity-20">
         <TrendingUp className="w-12 h-12 mx-auto mb-2" />
         <span className="text-[10px] font-black uppercase tracking-widest">Insufficient Trend Data</span>
      </div>
    </div>
  );

  const maxScore = Math.max(...chartData.map(d => d.score), 1);
  const latestScore = chartData[chartData.length - 1].score;
  const previousScore = chartData.length > 1 ? chartData[chartData.length - 2].score : latestScore;
  const isRising = latestScore >= previousScore;

  return (
    <div className="bg-[#151515] border border-[#2d2d2d] rounded-3xl p-8 h-[300px] group">
      <h3 className="text-xs font-black uppercase tracking-widest text-[#555] mb-8 flex items-center gap-2">
        <Target className="w-4 h-4 text-[#ef4444]" /> Global Risk Momentum
      </h3>

      <div className="flex items-end gap-1 h-32 mb-8 px-2">
        {chartData.slice(-24).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-2 group/bar">
            <div 
              className={`w-full rounded-t-sm transition-all duration-700 ${d.score > 50 ? 'bg-orange-500' : 'bg-white'} group-hover/bar:bg-[#3b82f6] shadow-lg shadow-white/5`} 
              style={{ height: `${(d.score / maxScore) * 100}%`, minHeight: '2px' }} 
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#222] pt-6">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isRising ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {isRising ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
            <span className="text-xl font-black text-white">{latestScore}%</span>
          </div>
          <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mt-1">CURRENT INDEX</p>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-black text-white uppercase tracking-tighter">
             {chartData[0].time} — {chartData[chartData.length - 1].time}
           </span>
           <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mt-1">OBSERVATION WINDOW</p>
        </div>
      </div>
    </div>
  );
}
