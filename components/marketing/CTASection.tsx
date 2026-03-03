"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SectionWrapper } from './SectionWrapper';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function CTASection({ showDivider }: { showDivider?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Request failed. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message || 'Access request received.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <SectionWrapper id="final-cta" showDivider={showDivider}>
      <div className="card bg-[var(--navy)] border border-[var(--rule)]/20 rounded-xl p-10 lg:p-16 shadow-2xl relative overflow-hidden text-white">
        {/* Subtle Glow Overlay */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/10 blur-[120px] rounded-full -mr-64 -mt-64" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left: Statement */}
          <div className="space-y-6 text-left">
            <h2 className="text-3xl lg:text-5xl font-serif font-medium leading-tight tracking-tight">
              Ready to enforce <br className="hidden lg:block" /> absolute policy?
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed max-w-md">
              Speak directly with our engineering systems team to evaluate Facttic for your mission-critical pipelines.
            </p>
          </div>

          {/* Right: Lead Capture */}
          <div className="space-y-6">
            {status === 'success' ? (
              <div className="space-y-4 p-8 border border-[var(--success)]/30 bg-[var(--success)]/5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[var(--success)]" />
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-[var(--success)]">
                    Protocol Initialized
                  </span>
                </div>
                <p className="text-sm font-medium text-white/80 leading-relaxed">
                  {message}
                </p>
                <button
                  type="button"
                  onClick={() => { setStatus('idle'); setMessage(''); }}
                  className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white/60 transition-colors mt-2"
                >
                  Submit Another Request →
                </button>
              </div>
            ) : (
              <>
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Institutional Email Address"
                    className="flex-1 h-14 px-5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                    required
                    disabled={status === 'loading'}
                    aria-label="Institutional Email Address for deployment protocol"
                  />
                  <Button 
                    variant="primary"
                    className={`h-14 px-10 text-[12px] uppercase tracking-[0.2em] font-black whitespace-nowrap bg-gradient-to-r from-[var(--blue)] to-[var(--accent)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all duration-300 ${status === 'loading' ? 'opacity-60 pointer-events-none' : ''}`}
                    aria-label="Initialize deployment protocol"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? 'INITIALIZING...' : 'INITIALIZE PROTOCOL'}
                  </Button>
                </form>

                {status === 'error' && message && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-2 h-2 bg-[var(--danger)]" />
                    <p className="text-[10px] font-mono font-bold text-[var(--danger)] uppercase tracking-[0.15em]">
                      {message}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {status !== 'success' && (
              <div className="flex items-center gap-3 px-1">
                <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.15em]">
                  Direct Engineering Access · SLA v1.0 Enabled
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
