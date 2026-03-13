"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Filter, X, ChevronDown } from 'lucide-react';
import IncidentTimeline from './IncidentTimeline';
import type { IncidentThread } from '@/lib/forensics/incidentService';

interface Props {
  incidents: IncidentThread[];
}

export default function IncidentControls({ incidents }: Props) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<number>(0);
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Extract unique models from all events
  const allModels = Array.from(
    new Set(incidents.flatMap(i => i.events.map(e => e.model)).filter(Boolean))
  );

  // Apply filters
  const filtered = incidents.filter(incident => {
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false;

    const maxRisk = Math.max(...incident.events.map(e => e.risk_score));
    if (maxRisk < riskFilter) return false;

    if (modelFilter !== 'all') {
      const hasModel = incident.events.some(e => e.model === modelFilter);
      if (!hasModel) return false;
    }

    return true;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <>
      {/* Controls Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 border rounded-xl transition-all ${
            showFilters || severityFilter !== 'all' || riskFilter > 0 || modelFilter !== 'all'
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          onClick={handleRefresh}
          className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-primary)] transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-5 max-w-[1000px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Filter Incidents</h3>
            <button
              onClick={() => { setSeverityFilter('all'); setRiskFilter(0); setModelFilter('all'); }}
              className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Severity</label>
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value)}
                  className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-2.5 px-4 pr-10 text-xs font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
                >
                  <option value="all">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Warning">Warning</option>
                  <option value="Normal">Normal</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>

            {/* Risk Score */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Min Risk Score: <span className="text-[var(--accent)]">{riskFilter}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={riskFilter}
                onChange={e => setRiskFilter(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Model</label>
              <div className="relative">
                <select
                  value={modelFilter}
                  onChange={e => setModelFilter(e.target.value)}
                  className="w-full appearance-none bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-2.5 px-4 pr-10 text-xs font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
                >
                  <option value="all">All Models</option>
                  {allModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] font-bold">
            Showing {filtered.length} of {incidents.length} incident threads
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="max-w-[1000px]">
        <IncidentTimeline incidents={filtered} />
      </div>
    </>
  );
}
