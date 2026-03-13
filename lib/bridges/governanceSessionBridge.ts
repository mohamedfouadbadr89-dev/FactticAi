import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

interface BridgeInput {
  session_id: string;
  org_id: string;
  prompt: string | null | undefined;
  decision: string;
  risk_score: number;
  violations: Array<{ rule_type?: string; policy_name?: string; severity?: number; actual_score?: number; explanation?: string; [key: string]: any }>;
}

type AllowedSignalType = 'intent_drift' | 'context_overflow' | 'instruction_override' | 'prompt_violation';

function mapSignalType(ruleType: string): AllowedSignalType {
  const t = (ruleType || '').toLowerCase();
  if (t.includes('intent') || t.includes('drift')) return 'intent_drift';
  if (t.includes('overflow') || t.includes('saturation') || t.includes('context')) return 'context_overflow';
  if (t.includes('override') || t.includes('hijack') || t.includes('instruction')) return 'instruction_override';
  return 'prompt_violation';
}

/**
 * Governance Session Bridge (v1.0)
 *
 * Mirrors a governance execution event into the session-based tables
 * that the Replay, Forensics, and Alerts dashboards read from.
 *
 * Write order:
 *   1. sessions              — upsert session row (idempotent)
 *   2. behavior_forensics    — one row per violation (signal mapping)
 *
 * This runs AFTER EvidenceLedger.write() and must never block or throw
 * in a way that surfaces to the caller. All errors are logged and swallowed.
 */
export async function mirrorGovernanceToSession({
  session_id,
  org_id,
  prompt,
  decision,
  risk_score,
  violations,
}: BridgeInput): Promise<void> {
  try {
    const now = new Date().toISOString();

    // 1. Upsert session row — correct schema: total_risk, status='completed', ended_at
    const { error: sessionError } = await supabaseServer
      .from('sessions')
      .upsert({
        id: session_id,
        org_id,
        status: 'completed',
        total_risk: risk_score,
        ended_at: now,
        created_at: now,
      }, { onConflict: 'id' });

    if (sessionError) {
      logger.warn('BRIDGE_SESSION_UPSERT_FAILED', { session_id, error: sessionError.message });
    }

    // 2. conversation_timeline writes removed — session event data lives in facttic_governance_events

    // 3. Store forensic signals in behavior_forensics — one row per violation
    const violationList = Array.isArray(violations) ? violations : [];
    for (const v of violationList) {
      const rawType = v.rule_type || v.policy_name || '';
      const signal_type = mapSignalType(rawType);
      const signal_score = v.actual_score ?? v.severity ?? 0;

      const { error: sigError } = await supabaseServer
        .from('behavior_forensics')
        .insert({
          org_id,
          session_id,
          signal_type,
          signal_score,
        });

      if (sigError) {
        logger.warn('BRIDGE_SIGNAL_INSERT_FAILED', { session_id, signal_type, error: sigError.message });
      }
    }

    logger.info('BRIDGE_MIRROR_COMPLETE', {
      session_id,
      decision,
      violation_count: violationList.length,
    });

  } catch (err: any) {
    // Bridge failures must never propagate — dashboards are read-path only
    logger.error('BRIDGE_MIRROR_FAILURE', { session_id, error: err.message });
  }
}
