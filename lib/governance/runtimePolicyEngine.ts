import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export type PolicyAction = 'allow' | 'warn' | 'block' | 'rewrite' | 'escalate' | 'redact';

export interface PolicyCondition {
  signal: 'hallucination' | 'pii_exposure' | 'policy_violation' | 'prompt_injection' | 'toxicity' | 'cost_spike';
  operator: '>' | '<' | '==' | 'contains';
  value: number | string;
}

export interface RuntimePolicy {
  id: string;
  name: string;
  condition: PolicyCondition;
  action: PolicyAction;
  enabled: boolean;
}

export class RuntimePolicyEngine {
  /**
   * Evaluates active policies for an organization against computed risk signals.
   */
  static async evaluate(orgId: string, signals: Record<string, number>): Promise<{ action: PolicyAction; reason: string } | null> {
    try {
      // 1. Fetch enabled policies
      const { data: policies, error } = await supabaseServer
        .from('runtime_policies')
        .select('*')
        .eq('org_id', orgId)
        .eq('enabled', true);

      if (error || !policies || policies.length === 0) return null;

      let severeAction: PolicyAction = 'allow';
      let severeReason = '';

      const actionPriority: Record<PolicyAction, number> = {
        'block': 5,
        'redact': 4,
        'rewrite': 3,
        'escalate': 2,
        'warn': 1,
        'allow': 0
      };

      // 2. Test each policy
      for (const policy of (policies as RuntimePolicy[])) {
        const { signal, operator, value } = policy.condition;
        const currentVal = signals[signal];

        if (currentVal === undefined) continue;

        let triggered = false;
        if (operator === '>') triggered = currentVal > Number(value);
        else if (operator === '<') triggered = currentVal < Number(value);
        else if (operator === '==') triggered = currentVal === value;

        if (triggered) {
          if (actionPriority[policy.action] > actionPriority[severeAction]) {
            severeAction = policy.action;
            severeReason = `Policy [${policy.name}] triggered: ${signal} ${operator} ${value} (Detected: ${currentVal.toFixed(1)})`;
          }
        }
      }

      return severeAction !== 'allow' ? { action: severeAction, reason: severeReason } : null;

    } catch (err: any) {
      logger.error('POLICY_ENGINE_EVAL_FAILED', { error: err.message, orgId });
      return null;
    }
  }

  /**
   * Seed some default policies for new orgs.
   */
  static async seedDefaultPolicies(orgId: string) {
    const defaults = [
      {
        org_id: orgId,
        name: 'Critical Hallucination Guard',
        condition: { signal: 'hallucination', operator: '>', value: 85 },
        action: 'block',
        enabled: true
      },
      {
        org_id: orgId,
        name: 'PII Redaction Policy',
        condition: { signal: 'pii_exposure', operator: '>', value: 50 },
        action: 'redact',
        enabled: true
      },
      {
        org_id: orgId,
        name: 'Toxic Content Filter',
        condition: { signal: 'toxicity', operator: '>', value: 70 },
        action: 'rewrite',
        enabled: true
      }
    ];

    await supabaseServer.from('runtime_policies').insert(defaults);
  }
}
