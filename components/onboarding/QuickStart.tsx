"use client";

import React from 'react';
import { 
  Zap, 
  Shield, 
  Play, 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles,
  X
} from "lucide-react";
import { useOnboardingState, OnboardingStep } from '@/hooks/useOnboardingState';

export default function QuickStart() {
  const { shouldShow, step, setStep, loading } = useOnboardingState();
  const [dismissed, setDismissed] = React.useState(false);

  if (!shouldShow || dismissed || loading) return null;

  const steps = [
    {
      id: 'connect' as OnboardingStep,
      title: 'Connect AI System',
      description: 'Link your first LLM provider to start monitoring.',
      icon: <Zap className="w-5 h-5" />,
      action: () => window.location.href = '/dashboard/connect',
      label: 'Setup Connection'
    },
    {
      id: 'policy' as OnboardingStep,
      title: 'Create First Policy',
      description: 'Define an automated rule to protect your data.',
      icon: <Shield className="w-5 h-5" />,
      action: () => window.location.href = '/dashboard/governance',
      label: 'Configure Policy'
    },
    {
      id: 'test' as OnboardingStep,
      title: 'Run Test Prompt',
      description: 'Verify your governance stack with the playground.',
      icon: <Play className="w-5 h-5" />,
      action: () => window.location.href = '/dashboard/playground',
      label: 'Open Playground'
    },
    {
      id: 'dashboard' as OnboardingStep,
      title: 'View Dashboard',
      description: 'Analyze telemetry and risk signals in real-time.',
      icon: <LayoutDashboard className="w-5 h-5" />,
      action: () => window.location.href = '/dashboard',
      label: 'Finish Setup'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--bg-primary)] transition-all text-[var(--text-secondary)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-12 space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 fill-current" />
              QuickStart Guide
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Welcome to Facttic AI</h1>
            <p className="text-[var(--text-secondary)] text-sm font-medium">Follow these steps to establish your organization's governance baseline.</p>
          </header>

          <div className="space-y-3">
            {steps.map((s, i) => (
              <div 
                key={s.id}
                className={`group flex items-center justify-between p-5 rounded-3xl border transition-all ${
                  step === s.id 
                  ? 'bg-[var(--bg-primary)] border-[var(--accent)] ring-4 ring-[var(--accent)]/5' 
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:border-[var(--text-secondary)]/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${step === s.id ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{s.title}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-tight">{s.description}</p>
                  </div>
                </div>
                {step === s.id && (
                  <button 
                    onClick={s.action}
                    className="py-2.5 px-6 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--accent)]/90 flex items-center gap-2 transition-all shadow-md shadow-[var(--accent)]/10"
                  >
                    {s.label}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <footer className="pt-4 border-t border-[var(--border-primary)]">
            <div className="flex items-center justify-between">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= steps.findIndex(x => x.id === step) + 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border-primary)]'}`} />
                 ))}
               </div>
               <button 
                 onClick={() => setDismissed(true)}
                 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
               >
                 Skip for now
               </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
