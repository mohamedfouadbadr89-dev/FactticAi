"use client";

import React, { useState, useEffect, useRef } from "react";
import type { DriftData } from "@/lib/dashboard/types";
import { CountUp } from "@/components/ui/CountUp";
import { logger } from "@/lib/logger";

interface Props {
  initialData?: DriftData | undefined;
  filters?: {
    startDate: string;
    endDate: string;
    modelVersion: string;
    channels: string[];
  };
}

export default function DriftTrendCard({ initialData, filters }: Props) {
  const [data, setData] = useState<DriftData | undefined>(initialData);
  const [period, setPeriod] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  
  const d = data ?? { current: "0.0%", avg_period: "0.0%", baseline: "0.0%" };

  // Replay State
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(1); // 1 = fully drawn
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    async function fetchDrift() {
      setIsLoading(true);
      try {
        const daysParam = filters ? 30 : period; // If global filters exist, we might want to prioritize them, but UI has its own selector too.
        // For now, let's just make it react to the local period, and maybe sync with filters if needed.
        const res = await fetch(`/api/governance/drift?days=${period}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        logger.error('DRIFT_FETCH_FAILED', { period, error: err });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDrift();
  }, [period]); // Period is still local, but filters could also trigger it in a more advanced implementation.

  useEffect(() => {
    if (filters?.startDate && filters?.endDate) {
      // Calculate days between dates for period
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setPeriod(diffDays.toString());
    }
  }, [filters]);

  const handleReplay = () => {
    if (isReplaying) return;
    setIsReplaying(true);
    setReplayProgress(0);
    
    let start: number | null = null;
    const duration = 1500; // 1.5s replay

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setReplayProgress(progress);
      
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(step);
      } else {
        setIsReplaying(false);
      }
    };
    
    animFrame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <div className="card h-full min-h-[220px] transition-all duration-300 hover:shadow-lg group">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="card-title select-none">Behavioral Drift Trend</h3>
          <p className="card-subtitle">Delta vs. Baseline v1.0.4</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isLoading}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            <option value="7">7D</option>
            <option value="30">30D</option>
            <option value="90">90D</option>
            <option value="180">180D</option>
          </select>
          <button 
            onClick={handleReplay}
            disabled={isReplaying || isLoading}
            className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)] disabled:opacity-30"
            title="Replay Analysis"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isReplaying ? "animate-spin" : ""}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Current Score</p>
            <div className="flex items-baseline gap-1">
              <CountUp value={parseFloat(d.current)} suffix="%" duration={1} decimals={1} className={`text-2xl font-bold tracking-tight ${parseFloat(d.current) > 2 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`} />
              <span className="text-[10px] text-[var(--warning)] font-black">↑ 4%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Avg. ({period}d)</p>
            <CountUp value={parseFloat(d.avg_period || d.avg_30d || "0")} suffix="%" duration={1.2} decimals={1} className="text-2xl font-bold tracking-tight text-[var(--text-primary)]" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Baseline</p>
            <div className="text-2xl font-bold tracking-tight text-[var(--text-secondary)] opacity-60 font-mono">{d.baseline}</div>
          </div>
        </div>

        {/* Mini Chart Visualization */}
        <div className="mt-8 h-16 w-full relative flex items-end gap-[2px]">
          {isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/50 backdrop-blur-[1px] z-10 rounded-lg">
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : null}
          
          {(data?.history || Array.from({ length: 40 })).map((_, i) => {
            const h = Math.random() * 80 + 20;
            const delay = i * 0.02;
            const isVisible = (i / 40) <= replayProgress;
            
            return (
              <div 
                key={i}
                className="flex-1 bg-[var(--accent)] rounded-t-[1px] transition-all duration-300 hover:opacity-100 hover:scale-y-110"
                style={{ 
                  height: `${isVisible ? h : 0}%`, 
                  opacity: isVisible ? 0.3 + (h / 200) : 0,
                  transitionDelay: isReplaying ? `${delay}s` : '0s'
                }}
              />
            );
          })}
          
          {/* Threshold Line */}
          <div className="absolute left-0 bottom-[30%] w-full h-[1px] bg-[var(--danger)]/30 border-t border-dashed border-[var(--danger)]/40 z-0">
             <span className="absolute -top-3 right-0 text-[8px] font-bold text-[var(--danger)] uppercase tracking-widest opacity-60">Critical Drift Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
