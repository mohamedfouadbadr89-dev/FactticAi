'use client';

import React from'react';
import { motion } from'framer-motion';

interface RiskDistributionChartProps {
 turns: { incremental_risk: number; turn_index: number }[];
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ turns }) => {
 if (turns.length === 0) return null;

 const maxVal = Math.max(...turns.map(t => t.incremental_risk), 0.1);
 const height = 120;
 const width = 400;
 const barWidth = Math.max(width / turns.length - 8, 2);

 return (
 <div className="w-full">
 <div className="flex justify-between items-end h-[120px] gap-2 items-stretch pt-2">
 {turns.map((turn, i) => {
 const barHeight = (turn.incremental_risk / 1.0) * height; // Scale relative to 100% risk
 
 return (
 <div key={i} className="flex-1 flex flex-col justify-end group transition-opacity">
 {/* Tooltip-like value */}
 <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono text-neutral-500 text-center mb-1">
 {(turn.incremental_risk * 100).toFixed(0)}%
 </div>
 
 <motion.div 
 initial={{ height: 0 }}
 animate={{ height:`${barHeight}px` }}
 transition={{ duration: 0.8, delay: i * 0.05 }}
 className={`w-full rounded-t-[1px] transition-colors ${
 turn.incremental_risk > 0.5 ?'bg-red-500/60' : 
 turn.incremental_risk > 0.1 ?'bg-orange-500/60' :'bg-emerald-500/60'
 }`}
 />
 
 <div className="mt-2 h-[1px] w-full" />
 <div className="text-[8px] font-mono text-center mt-1">
 T{turn.turn_index}
 </div>
 </div>
 );
 })}
 </div>
 
 <div className="mt-6 flex justify-between items-center text-[9px] font-mono text-neutral-400 uppercase tracking-widest border-t border-neutral-100 pt-4">
 <span>Temporal Risk Delta</span>
 <div className="flex gap-4">
 <div className="flex items-center gap-1">
 <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
 <span>Low</span>
 </div>
 <div className="flex items-center gap-1">
 <div className="w-2 h-2 rounded-full bg-orange-500/60" />
 <span>Med</span>
 </div>
 <div className="flex items-center gap-1">
 <div className="w-2 h-2 rounded-full bg-red-500/60" />
 <span>High</span>
 </div>
 </div>
 </div>
 </div>
 );
};
