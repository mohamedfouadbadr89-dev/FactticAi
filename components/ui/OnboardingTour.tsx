'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  path?: string; // Only show this step if we are on this path
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-nav-intelligence',
    title: 'Governance Intelligence',
    content: 'This is your central command center. Here you monitor behavioral drift, compliance scoring, and system health in real-time.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-reports',
    title: 'Advanced Reporting',
    content: 'Generate executive PDFs and distribute automated summaries directly to your stakeholders.',
    position: 'right',
  },
  {
    targetId: 'tour-nav-settings',
    title: 'System & Extensibility',
    content: 'Manage Access Control (RBAC), configure Datadog/Auth0 telemetry, and fine-tune system secrets.',
    position: 'right',
  },
  {
    targetId: 'tour-profile',
    title: 'Institutional Identity',
    content: 'Manage your personal profile, check your assigned roles, and update metadata.',
    position: 'right',
  }
];

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side once
    const hasSeenTour = localStorage.getItem('facttic_tour_completed');
    if (!hasSeenTour) {
      // Delay slightly so the DOM can settle
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [isVisible, currentStep, pathname]);

  const updateHighlight = () => {
    const step = TOUR_STEPS[currentStep];
    if (step.path && !pathname.startsWith(step.path)) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      el.classList.add('relative', 'z-[9999]');
    } else {
      // Elements that don't exist default to center screen briefly
      setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
    }
  };

  const cleanupHighlight = () => {
    const step = TOUR_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      el.classList.remove('relative', 'z-[9999]');
    }
  };

  const handleNext = () => {
    cleanupHighlight();
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    cleanupHighlight();
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  const completeTour = () => {
    cleanupHighlight();
    setIsVisible(false);
    localStorage.setItem('facttic_tour_completed', 'true');
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  // Calculate Popover Position
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10000,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const PADDING = 16;
  if (step.position === 'right') {
    popoverStyle.left = coords.left + coords.width + PADDING;
    popoverStyle.top = coords.top + (coords.height / 2);
    popoverStyle.transform = 'translateY(-50%)';
  } else if (step.position === 'bottom') {
    popoverStyle.top = coords.top + coords.height + PADDING;
    popoverStyle.left = coords.left + (coords.width / 2);
    popoverStyle.transform = 'translateX(-50%)';
  } else if (step.position === 'left') {
    popoverStyle.right = window.innerWidth - coords.left + PADDING;
    popoverStyle.top = coords.top + (coords.height / 2);
    popoverStyle.transform = 'translateY(-50%)';
  } else {
    // Top
    popoverStyle.top = coords.top - PADDING;
    popoverStyle.left = coords.left + (coords.width / 2);
    popoverStyle.transform = 'translate(-50%, -100%)';
  }

  return (
    <>
      {/* Dark Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300" />
      
      {/* Highlight Cutout Ring */}
      <div 
        className="fixed z-[9999] rounded-xl ring-4 ring-[var(--accent)] ring-offset-4 ring-offset-[var(--bg-primary)] pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' // Alternative cutout method
        }}
      />

      {/* Popover Card */}
      <div style={popoverStyle} className="w-80 bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-2xl rounded-2xl overflow-hidden animate-[fadeIn_.3s_ease-out]">
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-[var(--accent)] text-lg flex items-center gap-2">
              {step.title}
            </h3>
            <button onClick={completeTour} className="text-[var(--text-secondary)] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {step.content}
          </p>
        </div>
        
        <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
          <div className="text-xs font-mono font-medium text-[var(--text-secondary)]">
            {currentStep + 1} / {TOUR_STEPS.length}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrev} 
              disabled={currentStep === 0}
              className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md text-xs font-bold transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>Finish <CheckCircle2 className="w-3.5 h-3.5" /></>
              ) : (
                <>Next <ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
