import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export interface FraudEngineInputs {
  session_id: string;
  org_id: string;
  prompt: string;
  risk_score?: number;
  violations?: any[];
}

export class FraudDetectionEngine {
  static async evaluate(inputs: FraudEngineInputs) {
    let fraud_score = 0;

    const { data: allEvents, error: eError } = await supabaseServer
      .from('facttic_governance_events')
      .select('risk_score, violations, guardrail_signals, created_at, timestamp')
      .eq('session_id', inputs.session_id);

    let jailbreakAttempts = 0;
    let dataExfilAttempts = 0;
    let highRiskBursts = 0;
    let velocityCount = 0;

    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    if (!eError && allEvents) {
      for (const ev of allEvents) {
        const eventTime = ev.created_at ? new Date(ev.created_at).getTime() : Number(ev.timestamp);
        if (eventTime && eventTime > thirtySecondsAgo) {
          velocityCount++;
        }

        if ((ev.risk_score || 0) > 80) highRiskBursts++;

        const viols = Array.isArray(ev.violations) ? ev.violations : [];
        for (const v of viols) {
          if (v.rule_type === 'prompt_injection' || v.policy_name === 'prompt_injection') {
            jailbreakAttempts++;
          }
          if (
            v.rule_type === 'data_exfiltration' ||
            v.policy_name === 'DATA_EXFILTRATION' ||
            v.signal_type === 'DATA_EXFILTRATION'
          ) {
            dataExfilAttempts++;
          }
        }

        const sigs = Array.isArray(ev.guardrail_signals) ? ev.guardrail_signals : [];
        for (const s of sigs) {
          if (s.type === 'DATA_EXFILTRATION') dataExfilAttempts++;
          if (s.type === 'prompt_injection') jailbreakAttempts++;
        }
      }
    }

    // Add current inputs if provided
    velocityCount++; // always count current prompt

    if (inputs.risk_score && inputs.risk_score > 80) highRiskBursts++;
    if (inputs.violations) {
      for (const v of inputs.violations) {
        if (v.rule_type === 'prompt_injection' || v.policy_name === 'prompt_injection') {
          jailbreakAttempts++;
        }
        if (
          v.rule_type === 'data_exfiltration' ||
          v.policy_name === 'DATA_EXFILTRATION' ||
          v.signal_type === 'DATA_EXFILTRATION'
        ) {
          dataExfilAttempts++;
        }
      }
    }

    // 1) Prompt velocity > 10 prompts within 30 seconds -> +30 fraud score
    if (velocityCount > 10) fraud_score += 30;

    // 2) Jailbreak attempts > 5 prompt_injection violations -> +40
    if (jailbreakAttempts > 5) fraud_score += 40;

    // 3) Data exfiltration attempts > 3 DATA_EXFILTRATION signals -> +50
    if (dataExfilAttempts > 3) fraud_score += 50;

    // 4) High-risk bursts > 3 events risk_score > 80 -> +20
    if (highRiskBursts > 3) fraud_score += 20;

    let classification = 'normal';
    let action = 'allow';

    if (fraud_score >= 40 && fraud_score < 70) {
      classification = 'suspicious';
      action = 'throttle';
    } else if (fraud_score >= 70) {
      classification = 'malicious';
      action = 'block API key';
    }

    if (action === 'block API key') {
      try {
        await supabaseServer
          .from('api_keys')
          .update({ status: 'disabled' })
          .eq('org_id', inputs.org_id);
        
        logger.warn('FRAUD_BLOCK', { org_id: inputs.org_id, session_id: inputs.session_id, fraud_score });
      } catch (err: any) {
        logger.error('FRAUD_BLOCK_API_KEY_FAILED', { error: err.message });
      }
    }

    return {
      fraud_score,
      classification,
      action
    };
  }
}
