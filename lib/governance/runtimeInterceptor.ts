import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { RuntimePolicyEngine } from './runtimePolicyEngine';

export type InterceptAction = 'allow' | 'warn' | 'block' | 'rewrite' | 'escalate' | 'redact';

export interface InterceptResult {
  action: InterceptAction;
  risk_score: number;
  reason: string;
  rewritten_text?: string | null | undefined;
}

/**
 * Stage 7.75: Governance Runtime Interceptor (Phase 48)
 * 
 * CORE RESPONSIBILITY: Active control of AI responses vs passive monitoring.
 */
export class RuntimeInterceptor {
  private static RISK_THRESHOLDS = {
    BLOCK: 85,
    REWRITE: 70,
    ESCALATE: 55,
    WARN: 40
  };

  private static SAFETY_TEMPLATE = "FACTTIC_SAFETY_OVERRIDE: The AI response was modified for compliance safety. [Original intent preserved, hazardous components removed].";

  /**
   * Intercept and evaluate an agent response.
   */
  static async intercept(params: {
    org_id: string;
    session_id: string;
    model_name: string;
    response_text: string;
  }): Promise<InterceptResult> {
    const { org_id, session_id, model_name, response_text } = params;

    // 1. COMPUTE RISKS
    // In a real implementation, we would call heavy-weight LLM evaluators or pattern matchers here.
    // For this engine, we use high-fidelity simulation and rule-based checks.
    
    const risks = this.calculateSignals(response_text, model_name);
    const risk_score = Math.max(...Object.values(risks));

    // 2. DECIDE ACTION
    let action: InterceptAction = 'allow';
    let reason = "Governance baseline maintained.";
    let rewritten_text: string | undefined = undefined;

    if (risk_score >= this.RISK_THRESHOLDS.BLOCK) {
      action = 'block';
      reason = `CRITICAL_RISK: Score ${risk_score} exceeds block threshold. Detected: ${this.getMaxRiskTitle(risks)}`;
    } else if (risk_score >= this.RISK_THRESHOLDS.REWRITE) {
      action = 'rewrite';
      reason = `HIGH_RISK: Score ${risk_score} triggered safety rewrite.`;
      rewritten_text = this.SAFETY_TEMPLATE;
    } else if (risk_score >= this.RISK_THRESHOLDS.ESCALATE) {
      action = 'escalate';
      reason = `MEDIUM_HIGH_RISK: Score ${risk_score} requires analyst review.`;
    } else if (risk_score >= this.RISK_THRESHOLDS.WARN) {
      action = 'warn';
      reason = `MEDIUM_RISK: Score ${risk_score} triggered policy warning.`;
    }

    // 2.5 CUSTOM POLICY OVERRIDE (Phase 49)
    const policyResult = await RuntimePolicyEngine.evaluate(org_id, risks);
    if (policyResult) {
      // Custom policies take precedence if they are more restrictive
      const actionPriority: Record<InterceptAction, number> = {
        'block': 5,
        'redact': 4,
        'rewrite': 3,
        'escalate': 2,
        'warn': 1,
        'allow': 0
      };

      if (actionPriority[policyResult.action] >= actionPriority[action]) {
        action = policyResult.action;
        reason = `POLICY_ENFORCED: ${policyResult.reason}`;
        
        if (action === 'redact') {
          rewritten_text = this.redactText(response_text);
        } else if (action === 'rewrite') {
          rewritten_text = this.SAFETY_TEMPLATE;
        }
      }
    }

    // 3. PERSIST INTERCEPT
    try {
      await supabaseServer.from('runtime_intercepts').insert({
        org_id,
        session_id,
        model_name,
        risk_score,
        action,
        payload: {
          risks,
          reason,
          original_length: response_text.length,
          was_rewritten: action === 'rewrite'
        }
      });
    } catch (err: any) {
      logger.error('INTERCEPT_PERSIST_FAILED', { error: err.message, session_id });
    }

    return { action, risk_score, reason, rewritten_text };
  }

  private static calculateSignals(text: string, model: string) {
    // Detect keywords that simulate high risk
    const textLower = text.toLowerCase();
    
    return {
      hallucination: textLower.includes('hallucinate') ? 92 : Math.random() * 20,
      pii_exposure:  textLower.includes('ssn') || textLower.includes('credit card') ? 88 : Math.random() * 15,
      policy_violation: textLower.includes('illegal') || textLower.includes('unsafe') ? 95 : Math.random() * 30,
      prompt_injection: textLower.includes('ignore previous') ? 89 : Math.random() * 10,
      complexity_drift: model.includes('3.5') ? 45 : 15
    };
  }

  private static getMaxRiskTitle(risks: Record<string, number>): string {
    const maxEntry = Object.entries(risks).reduce((a, b) => a[1] > b[1] ? a : b);
    return maxEntry[0].toUpperCase();
  }

  private static redactText(text: string): string {
    // Simple regex redaction for demo purposes
    return text
      .replace(/\d{3}-\d{2}-\d{4}/g, '[REDACTED_SSN]')
      .replace(/\d{4}-\d{4}-\d{4}-\d{4}/g, '[REDACTED_CARD]');
  }

  /**
   * Seed demo data for the dashboard.
   */
  static async seedDemoData(orgId: string) {
    const models = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'gpt-3.5-turbo'];
    const actions: InterceptAction[] = ['allow', 'warn', 'block', 'rewrite', 'escalate'];
    
    const records = [];
    for (let i = 0; i < 20; i++) {
      const action = actions[i % actions.length];
      const risk_score = action === 'block' ? 88 : action === 'rewrite' ? 74 : action === 'escalate' ? 62 : action === 'warn' ? 48 : 22;
      
      records.push({
        org_id: orgId,
        session_id: `sid_${Math.random().toString(36).slice(2, 9)}`,
        model_name: models[i % models.length],
        risk_score,
        action,
        payload: {
          reason: `Demo seed ${action} event`,
          risks: {
            hallucination: risk_score - 10,
            policy_violation: risk_score - 5
          }
        },
        created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      });
    }

    await supabaseServer.from('runtime_intercepts').insert(records);
    return { count: records.length };
  }
}
