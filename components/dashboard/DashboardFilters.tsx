"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Layers, Activity, ChevronDown } from "lucide-react";

interface FilterState {
  startDate: string;
  endDate: string;
  modelVersion: string;
  channels: string[];
}

interface Props {
  onFilterChange: (filters: FilterState) => void;
}

export default function DashboardFilters({ onFilterChange }: Props) {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [modelVersion, setModelVersion] = useState("all");
  const [channels, setChannels] = useState(["chat", "voice"]);

  const handleApply = () => {
    onFilterChange({
      startDate,
      endDate,
      modelVersion,
      channels
    });
  };

  useEffect(() => {
    handleApply();
  }, [startDate, endDate, modelVersion, channels]);

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl shadow-sm mb-8 animate-[fadeIn_.3s_ease-out]">
      {/* Date Range */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
          <Calendar size={12} className="text-[var(--accent)]" />
          Timeframe
        </label>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-[var(--accent)] transition-colors"
          />
          <span className="text-[var(--text-secondary)] text-xs">→</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      <div className="h-8 w-px bg-[var(--border-primary)] hidden md:block" />

      {/* Model Version */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
          <Layers size={12} className="text-[var(--accent)]" />
          Model
        </label>
        <div className="relative">
          <select 
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
            className="appearance-none bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 pr-10 py-1.5 text-xs font-mono outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <option value="all">v1.2 (Active)</option>
            <option value="legacy">v1.1 (Stable)</option>
            <option value="experimental">v1.3-beta</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
        </div>
      </div>

      <div className="h-8 w-px bg-[var(--border-primary)] hidden md:block" />

      {/* Channels */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
          <Activity size={12} className="text-[var(--accent)]" />
          Channels
        </label>
        <div className="flex bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] p-0.5">
          {['chat', 'voice'].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
              }}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                channels.includes(ch) 
                ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm" 
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--success-bg)] text-[var(--success)] rounded-lg text-[10px] font-bold uppercase tracking-widest">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
          </span>
          Live Feed Active
        </div>
      </div>
    </div>
  );
}
