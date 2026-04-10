import { supabaseServer } from './supabaseServer';

/**
 * Kill Switch
 *
 * A per-org emergency bypass for the governance pipeline. When enabled, the
 * pipeline short-circuits with a passthrough ALLOW decision so traffic keeps
 * flowing while enforcement is suspended — useful when your own rules are
 * causing false positives in production and you need to unblock traffic
 * while you investigate.
 *
 * State lives in `org_settings.kill_switch_enabled` (see migration
 * 20260410000002_org_settings_kill_switch.sql).
 */

export interface KillSwitchState {
  enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

const DEFAULT_STATE: KillSwitchState = {
  enabled: false,
  reason: null,
  updated_at: null,
  updated_by: null,
};

/**
 * Read the kill switch state for an org. Fails open: if the DB is
 * unreachable or the row doesn't exist, returns { enabled: false }.
 */
export async function getKillSwitchState(orgId: string): Promise<KillSwitchState> {
  try {
    const { data, error } = await supabaseServer
      .from('org_settings')
      .select('kill_switch_enabled, kill_switch_reason, kill_switch_updated_at, kill_switch_updated_by')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error || !data) return DEFAULT_STATE;

    return {
      enabled: !!data.kill_switch_enabled,
      reason: data.kill_switch_reason ?? null,
      updated_at: data.kill_switch_updated_at ?? null,
      updated_by: data.kill_switch_updated_by ?? null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Hot path check used by GovernancePipeline.execute(). Wraps the DB read
 * in a 1s race so a slow settings query can never stall an AI response.
 */
export async function isKillSwitchEnabled(orgId: string): Promise<boolean> {
  const fallback: KillSwitchState = { ...DEFAULT_STATE };
  const state = await Promise.race<KillSwitchState>([
    getKillSwitchState(orgId),
    new Promise<KillSwitchState>((resolve) => setTimeout(() => resolve(fallback), 1000)),
  ]);
  return state.enabled;
}

/**
 * Flip the kill switch. Upserts the row and stamps the actor + reason.
 */
export async function setKillSwitch(params: {
  orgId: string;
  enabled: boolean;
  reason?: string | null;
  actorUserId?: string | null;
}): Promise<KillSwitchState> {
  const payload = {
    org_id: params.orgId,
    kill_switch_enabled: params.enabled,
    kill_switch_reason: params.reason ?? null,
    kill_switch_updated_at: new Date().toISOString(),
    kill_switch_updated_by: params.actorUserId ?? null,
  };

  const { data, error } = await supabaseServer
    .from('org_settings')
    .upsert(payload, { onConflict: 'org_id' })
    .select('kill_switch_enabled, kill_switch_reason, kill_switch_updated_at, kill_switch_updated_by')
    .single();

  if (error || !data) {
    throw new Error(`KILL_SWITCH_WRITE_FAILED: ${error?.message ?? 'unknown'}`);
  }

  return {
    enabled: !!data.kill_switch_enabled,
    reason: data.kill_switch_reason ?? null,
    updated_at: data.kill_switch_updated_at ?? null,
    updated_by: data.kill_switch_updated_by ?? null,
  };
}
