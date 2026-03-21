"use client";

import React, { useState } from 'react';
import { Play, Terminal, Shield, Sliders, Cpu, Activity } from "lucide-react";

interface PromptRunnerProps {
  onRun: (config: any) => Promise<void>;
  loading: boolean;
}

export default function PromptRunner({ onRun, loading }: PromptRunnerProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [channel, setChannel] = useState<'text' | 'voice'>('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onRun({ prompt, model, temperature, channel });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex border border-[var(--border-primary)] rounded-xl overflow-hidden w-full max-w-xs mb-4">
          <button 
            type="button" 
            onClick={() => setChannel('text')} 
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${channel === 'text' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/10'}`}
          >
            Text Mode
          </button>
          <button 
            type="button" 
            onClick={() => setChannel('voice')} 
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${channel === 'voice' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/10'}`}
          >
            Voice Mode
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Terminal className="w-3 h-3" /> Input {channel === 'voice' ? 'Transcript' : 'Prompt'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here for governance evaluation..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-4 text-sm min-h-[160px] focus:outline-none focus:border-[var(--accent)] transition-all resize-none font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Model Selection
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-3 px-4 text-sm focus:outline-none transition-all font-bold opacity-70 cursor-not-allowed"
            >
              <option value="universal">Universal Governance Engine</option>
              <option value="gpt-4o" disabled>GPT-4o (Optimization Pending)</option>
              <option value="claude-3-5" disabled>Claude 3.5 (Optimization Pending)</option>
            </select>
            <p className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-tighter mt-1">
              Model-specific optimization coming soon
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                <Sliders className="w-3 h-3" /> Temperature
              </label>
              <span className="text-[10px] font-black text-[var(--accent)]">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full py-4 bg-[var(--accent)] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[var(--accent)]/90 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/10 disabled:opacity-50"
        >
          {loading ? (
            <Activity className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'RUN ANALYSIS'}
        </button>
      </form>

      <div className="pt-6 border-t border-[var(--border-primary)]">
        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Shield className="w-3 h-3" /> Pipeline Integrity
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            All requests are routed through the <strong>Facttic GovernancePipeline</strong> (Stage 4.3). Execution bypasses local cache to ensure deterministic engine fresh-run.
          </p>
        </div>
      </div>
    </div>
  );
}
