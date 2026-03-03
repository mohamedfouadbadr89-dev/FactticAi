"use client";

import React, { useState, useEffect, useRef } from "react";

interface ThreatReplayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { time: "14:22:01", label: "Drift spike detected", detail: "Behavioral model divergence exceeded 1.5σ threshold.", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20" },
  { time: "14:22:04", label: "Policy violation confirmed", detail: "Outbound payload blocked. Unsanctioned endpoint connection attempted.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20" },
  { time: "14:22:05", label: "RCA engine triggered", detail: "Automated root cause analysis isolating prompt injection signature.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/20" },
  { time: "14:22:15", label: "Escalation executed", detail: "High-severity alert generated. Agent session forcibly terminated.", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20" },
  { time: "14:22:16", label: "Resolution logged", detail: "System state restored to baseline. Audit log securely updated.", icon: "M5 13l4 4L19 7", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
];

export function ThreatReplayPanel({ isOpen, onClose }: ThreatReplayPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      if (currentStep >= steps.length) {
        setIsPlaying(false);
        return;
      }
      timerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep]);

  // Reset if closed
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handlePlayPause = () => {
    if (currentStep >= steps.length) {
      setCurrentStep(0); // auto reset if at end
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-2xl z-[51] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-[var(--danger)]/50 ${isPlaying ? "animate-ping" : ""}`}></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--danger)]"></span>
            </span>
            <h2 className="font-semibold text-[var(--text-primary)]">Threat Replay</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 -mr-2 rounded-lg hover:bg-[var(--bg-primary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto px-8 py-10 relative">
          
          <div className="absolute top-10 bottom-10 left-[41px] w-0.5 bg-[var(--border-color)]" />

          <div className="space-y-8 relative">
            {steps.map((step, idx) => {
              const isVisible = currentStep > idx;
              const isCurrent = currentStep === idx + 1;
              const isPending = currentStep <= idx;

              return (
                <div 
                  key={idx} 
                  className={`flex gap-5 relative transition-all duration-[600ms] ${isVisible ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 filter grayscale"}`}
                >
                  <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${isVisible ? `${step.bg} ${step.color} border-current` : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)]"}`}>
                    <svg className={`h-3 w-3 ${isVisible ? "" : "opacity-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={step.icon} />
                    </svg>
                    {isCurrent && isPlaying && (
                      <span className="absolute -inset-1 rounded-full border border-current animate-ping opacity-20"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${isPending ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>{step.label}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{step.time}</span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isPending ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}`}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center justify-between gap-4">
            
            <button 
              onClick={handlePlayPause}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {isPlaying ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  {currentStep >= steps.length ? "Replay" : "Play"}
                </>
              )}
            </button>

            <button 
              onClick={handleStepForward}
              disabled={isPlaying || currentStep >= steps.length}
              className="px-4 py-2.5 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Step Forward"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
            </button>
            
            <button 
              onClick={handleReset}
              disabled={currentStep === 0}
              className="px-4 py-2.5 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-bold uppercase tracking-wider"
              title="Reset"
            >
              Reset
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 h-1 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

      </div>
    </>
  );
}
