import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { RuntimePolicyEngine } from './runtimePolicyEngine';
import { classify, ClassificationResult } from './llmClassifier';

export type InterceptAction = 'allow' | 'warn' | 'block' | 'rewrite' | 'escalate' | 'redact';

export interface InterceptResult {
  action: InterceptAction;
  risk_score: number;
  reason: string;
  rewritten_text?: string | null | undefined;
}

/**
 * Stage 7.75: Governance Runtime Interceptor (Phase 48) - EXTENDED
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
   * Intercept and evaluate an agent response using REAL LLM Classification.
   */
  static async intercept(params: {
    org_id: string;
    session_id: string;
    model_name: string;
    response_text: string;
  }): Promise<InterceptResult> {
    const { org_id, session_id, model_name, response_text } = params;

    // 1. COMPUTE RISKS via LLM CLASSIFIER
    const classification = await classify(response_text, 'response', org_id, session_id);
    const risk_score = classification.risk_score;
    const signals = this.mapFlagsToSignals(classification);

    // 2. DECIDE ACTION
    let action: InterceptAction = 'allow';
    let reason = classification.explanation || "Governance baseline maintained.";
    let rewritten_text: string | undefined = undefined;

    // Direct mapping from classifier decision if it's BLOCK
    if (classification.decision === 'BLOCK' || risk_score >= this.RISK_THRESHOLDS.BLOCK) {
      action = 'block';
      reason = `CRITICAL_RISK: Score ${risk_score} exceeds block threshold. ${classification.explanation}`;
    } else if (risk_score >= this.RISK_THRESHOLDS.REWRITE) {
      action = 'rewrite';
      reason = `HIGH_RISK: Score ${risk_score} triggered safety rewrite.`;
      rewritten_text = this.SAFETY_TEMPLATE;
    } else if (risk_score >= this.RISK_THRESHOLDS.ESCALATE) {
      action = 'escalate';
      reason = `MEDIUM_HIGH_RISK: Score ${risk_score} requires analyst review.`;
    } else if (risk_score >= this.RISK_THRESHOLDS.WARN || classification.decision === 'WARN') {
      action = 'warn';
      reason = `MEDIUM_RISK: Score ${risk_score} triggered policy warning.`;
    }

    // 2.5 CUSTOM POLICY OVERRIDE (Phase 49)
    // We pass the signals extracted from the LLM classifier flags
    const policyResult = await RuntimePolicyEngine.evaluate(org_id, signals);
    if (policyResult) {
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
          signals,
          classification_meta: {
            confidence: classification.confidence,
            explanation: classification.explanation,
            flags: classification.flags
          },
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

  /**
   * Maps boolean flags from the LLM classifier to numeric signals for the Policy Engine.
   */
  private static mapFlagsToSignals(res: ClassificationResult): Record<string, number> {
    return {
      hallucination: res.flags.hallucination ? res.risk_score : 10,
      pii_exposure: res.flags.pii ? res.risk_score : 5,
      policy_violation: res.flags.policy_violation ? res.risk_score : 15,
      prompt_injection: res.flags.prompt_injection || res.flags.jailbreak ? res.risk_score : 5,
      toxicity: res.flags.toxicity ? res.risk_score : 0,
      complexity_drift: 20 // Default baseline
    };
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

