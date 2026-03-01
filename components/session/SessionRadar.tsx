'use client';

import React from'react';
import { motion } from'framer-motion';

interface SessionRadarProps {
 factors: Record<string, number>;
}

export const SessionRadar: React.FC<SessionRadarProps> = ({ factors }) => {
 const categories = Object.keys(factors);
 const data = Object.values(factors);
 
 if (categories.length < 3) {
 return (
 <div className="flex flex-col items-center justify-center h-full border border-neutral-100 rounded-lg bg-neutral-50/50 p-8 text-center">
 <div className="mb-2">
 <svg className="w-8 h-8 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
 </svg>
 </div>
 <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Insufficient Data for Profiling</span>
 <p className="text-[9px] mt-1 max-w-[150px]">Requires at least 3 unique risk factors to generate signature.</p>
 </div>
 );
 }

 const size = 300;
 const center = size / 2;
 const radius = size * 0.35;
 const totalSides = categories.length;
 const angleStep = (Math.PI * 2) / totalSides;

 // Calculate coordinates for vertices
 const points = categories.map((_, i) => {
 const angle = i * angleStep - Math.PI / 2;
 // Normalize value - assuming max weight for a single category is high (~0.5 - 1.0)
 const value = Math.min(data[i] * 2, 1); // Scale for better visibility
 return {
 x: center + Math.cos(angle) * (radius * value),
 y: center + Math.sin(angle) * (radius * value),
 bgX: center + Math.cos(angle) * radius,
 bgY: center + Math.sin(angle) * radius,
 labelX: center + Math.cos(angle) * (radius + 25),
 labelY: center + Math.sin(angle) * (radius + 25)
 };
 });

 const pathData = points.map((p, i) =>`${i === 0 ?'M' :'L'} ${p.x} ${p.y}`).join('') +' Z';
 const bgPathData = points.map((p, i) =>`${i === 0 ?'M' :'L'} ${p.bgX} ${p.bgY}`).join('') +' Z';

 return (
 <div className="flex flex-col items-center">
 <div className="relative">
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
 {/* Background Pentagon/Hexagon */}
 <path d={bgPathData} fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
 
 {/* Radial Axis */}
 {points.map((p, i) => (
 <line key={i} x1={center} y1={center} x2={p.bgX} y2={p.bgY} stroke="#18181b" strokeWidth="1" />
 ))}

 {/* Concentric Circles */}
 {[0.25, 0.5, 0.75].map((r, i) => (
 <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="#27272a" strokeWidth="0.5" opacity="0.3" />
 ))}

 {/* Data Shape */}
 <motion.path 
 initial={{ pathLength: 0, opacity: 0 }}
 animate={{ pathLength: 1, opacity: 1 }}
 transition={{ duration: 1.5, ease:"easeInOut" }}
 d={pathData} 
 fill="var(--gold-soft)" 
 stroke="var(--gold)" 
 strokeWidth="2" 
 />

 {/* Vertices */}
 {points.map((p, i) => (
 <motion.circle 
 key={i} 
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ delay: 0.5 + (i * 0.1) }}
 cx={p.x} cy={p.y} r="3" fill="var(--gold)" 
 />
 ))}

 {/* Labels */}
 {points.map((p, i) => (
 <text 
 key={i} 
 x={p.labelX} 
 y={p.labelY} 
 textAnchor="middle" 
 className="text-[9px] font-mono font-bold fill- uppercase tracking-tighter"
 >
 {categories[i]}
 </text>
 ))}
 </svg>

 {/* Legend / Info Overlay */}
 <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-neutral-400 bg-white shadow-sm rounded border border-neutral-100">
 SIGNATURE_V1
 </div>
 </div>
 
 <div className="mt-4 flex gap-4">
 {categories.map((cat, i) => (
 <div key={i} className="flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
 <span className="text-[9px] font-mono text-neutral-500">{(data[i] * 10).toFixed(1)}</span>
 </div>
 ))}
 </div>
 </div>
 );
};
