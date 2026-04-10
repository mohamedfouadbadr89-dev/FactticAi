"use client";

import { useCallback, useEffect, useState } from 'react';

export type OnboardingStep = 'connect' | 'policy' | 'test' | 'dashboard' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['connect', 'policy', 'test', 'dashboard', 'complete'];

interface OnboardingStateResponse {
  step: OnboardingStep;
  completed: boolean;
  persisted_step?: OnboardingStep;
  inferred_step?: OnboardingStep;
}

/**
 * useOnboardingState
 *
 * Reads onboarding progress from /api/onboarding/state. The API combines the
 * persisted step on org_members with inferred progress from real org data
 * (connections / policies / governance events), so completed orgs never see
 * the modal even if nobody ever clicked "Finish".
 *
 * Manual progress is persisted server-side via advanceStep().
 */
export function useOnboardingState() {
  const [step, setStep] = useState<OnboardingStep>('connect');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/state', { credentials: 'include' });
      if (!res.ok) {
        // 401 / network: don't show the modal — fail closed.
        setCompleted(true);
        return;
      }
      const data: OnboardingStateResponse = await res.json();
      setStep(data.step);
      setCompleted(data.completed);
    } catch (err) {
      console.error('ONBOARDING_STATE_FETCH_ERROR', err);
      setCompleted(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  /**
   * Persist progress to the server. The server enforces forward-only motion,
   * so calling this with an earlier step is a no-op.
   */
  const advanceStep = useCallback(async (next: OnboardingStep) => {
    // Optimistic update: only move forward locally
    setStep((current) =>
      STEP_ORDER.indexOf(next) > STEP_ORDER.indexOf(current) ? next : current
    );
    if (next === 'complete') setCompleted(true);

    try {
      const res = await fetch('/api/onboarding/state', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: next }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.step) setStep(data.step);
        if (data?.completed) setCompleted(true);
      }
    } catch (err) {
      console.error('ONBOARDING_STATE_PATCH_ERROR', err);
    }
  }, []);

  const shouldShow = !loading && !completed;

  return { shouldShow, step, advanceStep, loading, refresh: fetchState };
}
