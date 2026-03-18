"use client";

import React, { useState } from 'react';
import PromptRunner from '@/components/playground/PromptRunner';
import GovernanceResults from '@/components/playground/GovernanceResults';
import { ShieldCheck, Info } from 'lucide-react';

export default function PlaygroundPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunGovernance = async (config: any) => {
    setLoading(true);
    setResults(null);
    setError(null);
    const sessionId = crypto.randomUUID();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt,
          model: config.model,
          session_id: sessionId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis timed out after 20 seconds. Please try again.');
      } else {
        setError(err.message || 'Governance pipeline execution failed.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">Governance Playground</h1>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Interactive sandbox for real-time prompt analysis and policy testing.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-xs font-bold text-[var(--text-secondary)]">
            <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
            DIRECT PIPELINE ACCESS
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Prompt Input */}
          <div className="lg:col-span-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-sm">
            <PromptRunner onRun={handleRunGovernance} loading={loading} />
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-sm h-full">
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                {error}
              </div>
            )}
            <GovernanceResults data={results} />
          </div>
        </div>
      </div>
    </div>
  );
}
