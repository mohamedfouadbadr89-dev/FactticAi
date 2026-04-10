import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Onboarding State API
 *
 * Source of truth for QuickStart progress. Combines two signals:
 *   1. Persisted step on org_members (manually advanced via PATCH or set when
 *      a user explicitly clicks "Finish Setup")
 *   2. Inferred step from real org data — if the org already has connections,
 *      policies, or governance events, the step auto-advances accordingly.
 *
 * The returned `step` is always the *furthest* of the two, so users can never
 * see onboarding regress and finished orgs never see QuickStart at all.
 */

export type OnboardingStep = 'connect' | 'policy' | 'test' | 'dashboard' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['connect', 'policy', 'test', 'dashboard', 'complete'];

function maxStep(a: OnboardingStep, b: OnboardingStep): OnboardingStep {
  return STEP_ORDER.indexOf(a) >= STEP_ORDER.indexOf(b) ? a : b;
}

async function inferStepFromData(orgId: string): Promise<OnboardingStep> {
  const [connections, policies, events] = await Promise.all([
    supabaseServer
      .from('ai_connections')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabaseServer
      .from('governance_policies')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabaseServer
      .from('facttic_governance_events')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
  ]);

  const hasConnection = (connections.count ?? 0) > 0;
  const hasPolicy = (policies.count ?? 0) > 0;
  const hasEvent = (events.count ?? 0) > 0;

  if (hasEvent) return 'dashboard';
  if (hasPolicy) return 'test';
  if (hasConnection) return 'policy';
  return 'connect';
}

export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  try {
    const { data: member, error } = await supabaseServer
      .from('org_members')
      .select('onboarding_step, onboarding_completed_at')
      .eq('org_id', orgId)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('ONBOARDING_STATE_READ_FAILED', { orgId, error: error.message });
    }

    const persistedStep: OnboardingStep =
      (member?.onboarding_step as OnboardingStep | undefined) ?? 'connect';
    const inferredStep = await inferStepFromData(orgId);
    const step = maxStep(persistedStep, inferredStep);

    const completed = step === 'complete' || !!member?.onboarding_completed_at;

    return NextResponse.json({
      step,
      completed,
      persisted_step: persistedStep,
      inferred_step: inferredStep,
    });
  } catch (err: any) {
    logger.error('ONBOARDING_STATE_GET_ERROR', { orgId, error: err?.message });
    // Fail-open: if state can't be read, hide the modal rather than blocking the dashboard.
    return NextResponse.json({
      step: 'complete' as OnboardingStep,
      completed: true,
      persisted_step: 'complete' as OnboardingStep,
      inferred_step: 'complete' as OnboardingStep,
    });
  }
});

export const PATCH = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedStep = body?.step as OnboardingStep | undefined;

    if (!requestedStep || !STEP_ORDER.includes(requestedStep)) {
      return NextResponse.json({ error: 'INVALID_STEP' }, { status: 400 });
    }

    // Read current persisted step so we never move backwards
    const { data: existing } = await supabaseServer
      .from('org_members')
      .select('onboarding_step')
      .eq('org_id', orgId)
      .limit(1)
      .maybeSingle();

    const currentStep: OnboardingStep =
      (existing?.onboarding_step as OnboardingStep | undefined) ?? 'connect';
    const nextStep = maxStep(currentStep, requestedStep);

    const update: Record<string, any> = { onboarding_step: nextStep };
    if (nextStep === 'complete') {
      update.onboarding_completed_at = new Date().toISOString();
    }

    const { error } = await supabaseServer
      .from('org_members')
      .update(update)
      .eq('org_id', orgId);

    if (error) {
      logger.error('ONBOARDING_STATE_WRITE_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'WRITE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ step: nextStep, completed: nextStep === 'complete' });
  } catch (err: any) {
    logger.error('ONBOARDING_STATE_PATCH_ERROR', { orgId, error: err?.message });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});
