"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type OnboardingStep = 'connect' | 'policy' | 'test' | 'dashboard' | 'complete';

export function useOnboardingState() {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<OnboardingStep>('connect');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        setLoading(true);
        
        // 1. Get current session/org
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Hardcoded org_id for Level 1 consistency as per previous patterns
        const org_id = 'dbad3ca2-3907-4279-9941-8f55c3c0efdc';

        // 2. Query trigger conditions
        const [connections, policies, events] = await Promise.all([
          supabase.from('ai_connections').select('id', { count: 'exact', head: true }).eq('org_id', org_id),
          supabase.from('governance_policies').select('id', { count: 'exact', head: true }).eq('org_id', org_id),
          supabase.from('governance_event_ledger').select('id', { count: 'exact', head: true }).eq('org_id', org_id)
        ]);

        const hasNoData = (connections.count === 0) && (policies.count === 0) && (events.count === 0);
        
        if (hasNoData) {
          setShouldShow(true);
          // Determine starting step based on what's missing (though if hasNoData is true, we start at 1)
          setStep('connect');
        } else {
          setShouldShow(false);
        }
      } catch (err) {
        console.error('ONBOARDING_CHECK_ERROR:', err);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, []);

  return { shouldShow, step, setStep, loading };
}
