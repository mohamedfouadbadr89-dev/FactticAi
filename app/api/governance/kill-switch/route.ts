import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { getKillSwitchState, setKillSwitch } from '@/lib/killSwitch';
import { logger } from '@/lib/logger';

/**
 * GET  /api/governance/kill-switch  → current state for the auth'd org
 * PATCH /api/governance/kill-switch → { enabled: boolean, reason?: string }
 *
 * When enabled, GovernancePipeline.execute() short-circuits with a passthrough
 * ALLOW so traffic keeps flowing while enforcement is suspended. The switch is
 * per-org and flips instantly — no redeploy, no restart.
 */

export const GET = withAuth(async (_req: Request, { orgId }: AuthContext) => {
  try {
    const state = await getKillSwitchState(orgId);
    return NextResponse.json(state);
  } catch (err: any) {
    logger.error('KILL_SWITCH_GET_ERROR', { orgId, error: err?.message });
    return NextResponse.json(
      { enabled: false, reason: null, updated_at: null, updated_by: null },
      { status: 200 }
    );
  }
});

export const PATCH = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const body = await req.json().catch(() => ({}));
    const enabled = body?.enabled;
    const reason: string | null =
      typeof body?.reason === 'string' && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 500)
        : null;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'INVALID_ENABLED_FIELD' }, { status: 400 });
    }

    const state = await setKillSwitch({
      orgId,
      enabled,
      reason,
      actorUserId: userId,
    });

    logger.warn('KILL_SWITCH_TOGGLED', { orgId, userId, enabled, reason });
    return NextResponse.json(state);
  } catch (err: any) {
    logger.error('KILL_SWITCH_PATCH_ERROR', { orgId, error: err?.message });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});
