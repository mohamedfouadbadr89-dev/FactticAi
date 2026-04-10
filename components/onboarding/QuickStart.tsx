"use client";

import React from 'react';
import {
  Zap,
  Shield,
  Play,
  LayoutDashboard,
  ChevronRight,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { useOnboardingState, OnboardingStep } from '@/hooks/useOnboardingState';

const STEP_ORDER: OnboardingStep[] = ['connect', 'policy', 'test', 'dashboard', 'complete'];

interface StepDef {
  id: OnboardingStep;
  next: OnboardingStep;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  label: string;
}

const STEPS: StepDef[] = [
  {
    id: 'connect',
    next: 'policy',
    title: 'Connect AI System',
    description: 'Link your first LLM provider to start monitoring.',
    icon: <Zap className="w-5 h-5" />,
    href: '/dashboard/connect',
    label: 'Setup Connection',
  },
  {
    id: 'policy',
    next: 'test',
    title: 'Create First Policy',
    description: 'Define an automated rule to protect your data.',
    icon: <Shield className="w-5 h-5" />,
    href: '/dashboard/governance',
    label: 'Configure Policy',
  },
  {
    id: 'test',
    next: 'dashboard',
    title: 'Run Test Prompt',
    description: 'Verify your governance stack with the playground.',
    icon: <Play className="w-5 h-5" />,
    href: '/dashboard/playground',
    label: 'Open Playground',
  },
  {
    id: 'dashboard',
    next: 'complete',
    title: 'View Dashboard',
    description: 'Analyze telemetry and risk signals in real-time.',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/dashboard',
    label: 'Finish Setup',
  },
];

export default function QuickStart() {
  const { shouldShow, step, advanceStep, loading } = useOnboardingState();
  const [dismissed, setDismissed] = React.useState(false);

  if (!shouldShow || dismissed || loading) return null;

  const currentIdx = STEPS.findIndex((s) => s.id === step);

  const handleAction = (s: StepDef) => {
    // Persist forward motion before navigating away.
    void advanceStep(s.next);
    if (s.id === 'dashboard') {
      // Final step: stay on the dashboard, just close the modal.
      setDismissed(true);
      return;
    }
    window.location.href = s.href;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--bg-primary)] transition-all text-[var(--text-secondary)]"
          aria-label="Dismiss QuickStart"
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
            {STEPS.map((s, i) => {
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between p-5 rounded-3xl border transition-all ${
                    isActive
                      ? 'bg-[var(--bg-primary)] border-[var(--accent)] ring-4 ring-[var(--accent)]/5'
                      : isDone
                      ? 'bg-[var(--bg-secondary)] border-[var(--success)]/40'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] opacity-60 hover:opacity-100 hover:border-[var(--text-secondary)]/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        isActive
                          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                          : isDone
                          ? 'bg-[var(--success)]/15 text-[var(--success)]'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {isDone ? <Check className="w-5 h-5" /> : s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{s.title}</h3>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-tight">{s.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => handleAction(s)}
                      className="py-2.5 px-6 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--accent)]/90 flex items-center gap-2 transition-all shadow-md shadow-[var(--accent)]/10"
                    >
                      {s.label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <footer className="pt-4 border-t border-[var(--border-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i <= currentIdx ? 'bg-[var(--accent)]' : 'bg-[var(--border-primary)]'
                    }`}
                  />
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
