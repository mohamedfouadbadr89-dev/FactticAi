'use client';

import React from'react';
import { motion } from'framer-motion';

interface Factor {
 type: string;
 weight: number;
}

interface TurnCardProps {
 turn: {
 id: string;
 role:'user' |'assistant' |'system';
 content: string;
 turn_index: number;
 incremental_risk: number;
 factors: Factor[];
 };
 onInspect: (turn: any) => void;
}

export const TurnCard: React.FC<TurnCardProps> = ({ turn, onInspect }) => {
 const isAssistant = turn.role ==='assistant';
 const riskColor = turn.incremental_risk > 0.5 ?'text-red-400' : 
 turn.incremental_risk > 0.1 ?'text-orange-400' :'text-emerald-400';

 return (
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className={`border-l-2 pl-6 py-4 relative transition-colors duration-300 ${isAssistant ?'border-[var(--navy)]' :'border-neutral-100'}`}
 >
 {/* Turn Index Bubble */}
 <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-[10px] font-mono">
 {turn.turn_index}
 </div>

 <div className="flex justify-between items-start mb-2">
 <span className={`text-xs font-bold uppercase tracking-widest font-mono transition-colors duration-300 ${isAssistant ?'text-[var(--navy)]' :'text-neutral-400'}`}>
 {turn.role}
 </span>
 <div className="flex items-center gap-3">
 <span className={`text-sm font-mono font-bold ${riskColor}`}>
 RISK: {(turn.incremental_risk * 100).toFixed(1)}%
 </span>
 <button 
 onClick={() => onInspect(turn)}
 className="text-[10px] hover: px-2 py-1 rounded transition-colors uppercase font-bold tracking-tighter"
 >
 Inspect RCA
 </button>
 </div>
 </div>

 <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
 {turn.content}
 </p>
 </motion.div>
 );
};
