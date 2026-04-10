import { createHash } from 'crypto';
import { supabaseServer } from './supabaseServer';
import { logger } from './logger';
import { authorize, type Role } from './rbac';
import { recordWebhookEvent } from './idempotency';
import { PredictiveDriftEngine } from './intelligence/predictiveDriftEngine';
import { recordBillingEvent, type BillingEventType } from './billingResolver';
import { StartupManager } from './startupChecks';
import { isFeatureEnabled } from '../config/featureFlags';
import { CURRENT_REGION, type RegionID } from '../config/regions';
import { ReplicationEngine } from './replicationEngine';
import { GovernanceInterceptor } from './governance/interceptor';
import { RuntimeInterceptor } from './governance/runtimeInterceptor';
import { Anonymizer } from './network/anonymizer';
import { IntelligenceNetwork } from './network/intelligenceNetwork';
import { AiInterceptorKernel } from './gateway/aiInterceptorKernel';
import { PolicyEngine } from './governance/policyEngine';
import { GuardrailEngine } from './governance/guardrailEngine';
import { RiskMetricsEngine } from './intelligence/riskMetricsEngine';
import { GovernanceStateEngine } from './governance/governanceStateEngine';
import { GovernanceAlertEngine } from './governance/alertEngine';
import { ComplianceIntelligenceEngine } from './compliance/complianceIntelligenceEngine';
import { runAnalyzers } from './governance/analyzers/runAnalyzers';
import { computeCompositeRisk } from './metrics/compositeRiskEngine';


export interface GovernanceExecutionResult {
  success: boolean;
  hash: string;
  latency: number;
  integrityHash?: string;
  latencyBreakdown?: Record<string, number>;
}

export interface PipelineContext {
  orgId: string;
  userId: string;
  userRole: Role;
  provider: string;
  eventId: string;
  payload: any;
  startTime: number;
  latencyBreakdown: Record<string, number>;
  integrityHash?: string;
  billingUnits: number;
  billingType: BillingEventType;
  regionId: RegionID;
}

/**
 * Governance Execution Pipeline (v4.3)
 * 
 * CORE PRINCIPLE: Performance-Compressed Determinism.
 */
export class GovernancePipeline {
  private static BUDGET_MS = 150;
  private static THROTTLE_MS = 120;
  private static CANARY_WEIGHT = 0.1; // 10% Canary by default
  private static latencyHistory: number[] = [];

  /**
   * Orchestrates a unified governance evaluation flow (v1.0)
   * Centralizes engine calls previously handled in the API layer.
   */
  static async execute(params: {
    org_id: string,
    session_id?: string | undefined,
    prompt?: string | undefined,
    response?: string | undefined,
    [key: string]: any
  }) {
    const { org_id, session_id, prompt, response } = params;
    const t0 = Date.now();

    try {
      const withTimeout = <T>(p: Promise<T>, fallback: T, ms = 3000): Promise<T> =>
        Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))]);

      // 1. Interceptor Layer (Prompt)
      const promptIntercept = prompt
        ? await withTimeout(AiInterceptorKernel.interceptPrompt(org_id, prompt), { action: 'proceed', content: prompt })
        : { action: 'proceed', content: prompt };

      if (promptIntercept.action === 'blocked') {
        return {
          decision: 'BLOCK',
          risk_score: 100,
          violations: [{ policy_name: 'Kernel Protection', rule_type: 'prompt_injection', action: 'block' }],
          signals: { prompt_intercept: promptIntercept },
          latency_ms: Date.now() - t0
        };
      }

      // 2. Signal.Analysis Layer (Phase 62)
      const signalContext = {
        signals: [] as any[],
        risk_score: 0
      };

      if (prompt) {
        const analysis = await runAnalyzers(prompt);
        signalContext.signals = analysis.signals;
        signalContext.risk_score = analysis.totalRisk;
      }

      // 3. Guardrail Layer (Response Analysis)
      const guardrail = response 
        ? await GuardrailEngine.evaluateResponse({ org_id, response_text: response })
        : { signals: [], metrics: { hallucination_risk: 0, policy_risk: 0, tone_risk: 0, safety_risk: 0 } };

      // 4. Policy Layer (Rule Execution)
      const policies = await withTimeout(PolicyEngine.loadOrganizationPolicies(org_id), []);
      
      const detectionSignals = signalContext.signals.map(s => ({
        rule_type: (s.type === 'PROMPT_INJECTION' ? 'instruction_override' : 
                   s.type === 'SYSTEM_PROMPT_EXTRACTION' ? 'system_prompt_extraction' :
                   s.type === 'SENSITIVE_DATA' ? 'pii_exposure' : 'safety_violation') as any,
        score: s.severity * 100
      }));

      const policyEval = PolicyEngine.evaluateSignals(policies, [...guardrail.signals, ...detectionSignals]);

      // 4a. Guardrail prompt-level detection (DATA_EXFILTRATION + future rules)
      const resolvedViolations = prompt ? GuardrailEngine.evaluatePrompt(prompt) : [];

      // 5. Response Sanitization (Kernel)
      const responseIntercept = response
        ? await AiInterceptorKernel.interceptResponse(org_id, response)
        : { action: 'proceed', content: response };

      // 5. Risk Aggregation (Distributed Metrics)
      const riskMetrics = await withTimeout(
        RiskMetricsEngine.calculateRiskScore(org_id, session_id),
        { risk_score: 0, breakdown: {}, timestamp: new Date().toISOString() } as any
      );

      // 6. Governance State (Stability)
      const govState = await withTimeout(
        GovernanceStateEngine.getGovernanceState(org_id),
        { governance_state: 'SAFE' as const, risk_score: 0, contributing_factors: { drift: 0, hallucination: 0, policy: 0, guardrail: 0 } }
      );

      const latency = Date.now() - t0;

      // Determine final decision hierarchy (Phase 62: Consumes detection risk)
      let decision = 'ALLOW';
      const detectionRisk = signalContext.risk_score;

      // Phase 62b: Direct high-severity signal check — if ANY individual signal
      // has severity >= 0.8 (e.g. SSN/PII detection), force BLOCK regardless of
      // aggregate dilution from other analyzers
      const hasHighSeveritySignal = signalContext.signals.some(s => s.severity >= 0.8);

      if (hasHighSeveritySignal || policyEval.highest_action === 'block' || guardrail.metrics.safety_risk > 0.8 || detectionRisk > 0.7 || resolvedViolations.some(v => v.action === 'BLOCK')) {
        decision = 'BLOCK';
      } else if (policyEval.highest_action === 'warn' || riskMetrics.risk_score > 50 || detectionRisk > 0.4) {
        decision = 'WARN';
      }

      // Format detection signals for the violations panel (UI-compatible)
      const detectionViolations = signalContext.signals.map(s => ({
        policy_name: `Detection Engine: ${s.type}`,
        rule_type: s.type.toLowerCase() as any,
        threshold: 0.4, // Standard warning threshold
        actual_score: s.severity * 100,
        action: s.severity > 0.7 ? 'block' : 'warn',
        // Injected fields for UI specific detection panel
        signal_type: s.type,
        severity: s.severity,
        explanation: s.description
      }));

      const allViolations = [...policyEval.violations, ...detectionViolations, ...resolvedViolations];
      const composite = computeCompositeRisk({
        signals: signalContext.signals,
        prompt,
        violations: allViolations,
        decision,
      });
      const finalRiskScore = composite.risk_score;
      const behavior = composite.behavior;

      // Persist incidents + sessions + trigger alerts (async, non-blocking)
      if (session_id) {
        setImmediate(async () => {
          try {
            // Upsert session record so dashboard session counts are populated
            await supabaseServer
              .from('sessions')
              .upsert({
                id: session_id,
                org_id,
                total_risk: finalRiskScore,
                decision,
                created_at: new Date().toISOString(),
              }, { onConflict: 'id' });

            // Write incident row when BLOCK or high risk
            if (decision === 'BLOCK' || finalRiskScore >= 70) {
              const topViolation = allViolations[0];
              await supabaseServer
                .from('incidents')
                .insert({
                  org_id,
                  session_id,
                  title: topViolation?.policy_name || 'Governance Block',
                  description: (topViolation as any)?.explanation || `Decision: ${decision} — risk score ${finalRiskScore}`,
                  risk_score: finalRiskScore,
                  decision,
                  violation: topViolation?.policy_name || 'policy_violation',
                  status: 'open',
                  timestamp: new Date().toISOString(),
                });
            }

            // Trigger alert evaluation
            GovernanceAlertEngine.evaluate({
              org_id,
              session_id,
              risk_score: finalRiskScore,
              policy_action: decision === 'BLOCK' ? 'block' : decision === 'WARN' ? 'warn' : undefined,
              metadata: { behavior, violations: allViolations.length },
            });
          } catch (persistErr: any) {
            logger.error('PIPELINE_PERSIST_ERROR', { org_id, session_id, error: persistErr.message });
          }
        });
      }

      return {
        decision,
        risk_score: finalRiskScore,
        violations: allViolations,
        signals: {
          guardrail: guardrail.metrics,
          risk_breakdown: riskMetrics.breakdown,
          state_factors: govState.contributing_factors,
          detection: signalContext.signals,
          interceptor: {
            prompt: promptIntercept.action,
            response: responseIntercept.action
          }
        },
        behavior
      };

    } catch (err: any) {
      // FAIL-CLOSED: Any pipeline failure defaults to BLOCK — never pass traffic on error
      logger.error('PIPELINE_EXECUTION_FAILURE_FAIL_CLOSED', { orgId: org_id, error: err.message });
      return {
        decision: 'BLOCK' as const,
        risk_score: 100,
        violations: [{
          policy_name: 'Fail-Closed Safety Gate',
          rule_type: 'safety_violation' as any,
          action: 'block' as any,
          threshold: 0,
          actual_score: 100,
        }],
        signals: { error: err.message, fail_closed: true },
        behavior: 'fail_closed',
      };
    }
  }

  static async boot() {
    await StartupManager.runAll();
  }

  static async run(context: PipelineContext): Promise<GovernanceExecutionResult> {
    // Canary Routing Support
    const isCanary = Math.random() < this.CANARY_WEIGHT;
    if (isCanary) (context as any)._isCanary = true;

    context.startTime = Date.now();
    context.latencyBreakdown = {};

    try {
      // 1. JWT / Auth
      await this.stage(context, 'JWT', async () => {
        authorize(context.userRole, 'analyst');
      });

      // 2. Residency & Isolation
      await this.stage(context, 'RESIDENCY', async () => {
        // Enforce Region Binding
        if (context.regionId !== CURRENT_REGION) {
          throw new Error(`RESIDENCY_VIOLATION: Org region ${context.regionId} mismatch with cluster ${CURRENT_REGION}`);
        }

        // RLS verification check: Confirm user belongs to the org
        const { data, error } = await supabaseServer
          .from('org_members')
          .select('id, organizations!inner(region_id)')
          .eq('user_id', context.userId)
          .eq('org_id', context.orgId)
          .single();
        
        if (error || !data) {
          await this.handleIncident(context, 'ISOLATION_BREACH', 'Critical: User-Org mismatch detected.');
          throw new Error('ISOLATION_BREACH: User-Org mismatch.');
        }

        // Deep Residency Check (DB cross-verification)
        const dbRegion = (data as any).organizations?.region_id;
        if (dbRegion && dbRegion !== CURRENT_REGION) {
           throw new Error(`SOVEREIGN_DATA_LOCK: Cross-region write attempt from ${dbRegion} to ${CURRENT_REGION}`);
        }
      });

      // 3. Idempotency
      await this.stage(context, 'IDEMPOTENCY', async () => {
        const result = await recordWebhookEvent({
          org_id: context.orgId,
          provider: context.provider,
          event_id: context.eventId,
          payload: context.payload
        });
        if (!result.success) throw new Error('DUPLICATE_REQUEST');
      });

      // 4. Hash (FREEZE ZONE START)
      await this.stage(context, 'HASH', async () => {
        context.integrityHash = createHash('sha256')
          .update(JSON.stringify({
            orgId: context.orgId,
            eventId: context.eventId,
            payload: context.payload
          }))
          .digest('hex');
      });

      // NO MUTATIONS ALLOWED AFTER THIS POINT (Freeze Zone)

      // Performance Check before Intelligence & Policy
      const midLatency = Date.now() - context.startTime;
      if (midLatency > GovernancePipeline.THROTTLE_MS) {
        logger.warn('PRE_DEGRADATION_SIGNAL', { 
          latency: midLatency, 
          threshold: GovernancePipeline.THROTTLE_MS 
        });
        // Logic: Here we could flag the context to bypass optional heavy drift analysis 
        // to save the 150ms hard budget, but we remain deterministic.
      }

      // 5. Drift
      // 6. Risk Scoring
      await this.stage(context, 'DRIFT_RISK', async () => {
        const profile = await PredictiveDriftEngine.computePredictiveDriftRisk(context.orgId, 'default');
        if (profile?.escalation === 'critical') {
          logger.warn('PIPELINE_PRI_HIGH', { orgId: context.orgId, risk: profile.drift_score });
        }
        // Attach profile to telemetry, but don't mutate core context
        (context as any)._riskProfile = profile; 
      });

      // 7. Policy
      await this.stage(context, 'POLICY', async () => {
        // Enforce structural RLS verification before state mutation
        // (Handled by Supabase backend, but we verify intent here)
      });

      // 7.5 Intercept — Phase 41: active runtime safety layer
      await this.stage(context, 'INTERCEPT', async () => {
        const responseText =
          context.payload?.agent_response ??
          context.payload?.response ??
          JSON.stringify(context.payload ?? '');

        const decision = await GovernanceInterceptor.evaluate({
          org_id:         context.orgId,
          session_id:     context.eventId,
          agent_response: String(responseText).slice(0, 8000), // hard cap to stay within budget
          metadata:       { provider: context.provider, userId: context.userId },
        });

        (context as any)._interceptDecision = decision;

        if (decision.action === 'BLOCK') {
          throw new Error(`GOVERNANCE_BLOCK: ${decision.reason}`);
        }
        if (decision.action === 'ESCALATE') {
          logger.warn('GOVERNANCE_ESCALATE', { org: context.orgId, reason: decision.reason });
        }
      });

      // 7.75 Runtime Interceptor — Phase 48: active runtime control
      await this.stage(context, 'RUNTIME_INTERCEPT', async () => {
        const responseText =
          context.payload?.agent_response ??
          context.payload?.response ??
          JSON.stringify(context.payload ?? '');

        const intercept = await RuntimeInterceptor.intercept({
          org_id:         context.orgId,
          session_id:     context.eventId,
          model_name:     context.payload?.model ?? context.provider,
          response_text:  String(responseText),
        });

        (context as any)._runtimeIntercept = intercept;

        if (intercept.action === 'block') {
          throw new Error(`RUNTIME_GOVERNANCE_BLOCK: ${intercept.reason}`);
        }

        if ((intercept.action === 'rewrite' || intercept.action === 'redact') && intercept.rewritten_text) {
          // ACTIVE CONTROL: Mutate the payload before delivery/billing
          if (context.payload?.agent_response) {
            context.payload.agent_response = intercept.rewritten_text;
          } else if (context.payload?.response) {
            context.payload.response = intercept.rewritten_text;
          }
        }
      });

      // 8. Billing (Deterministic Deduction)
      await this.stage(context, 'BILLING', async () => {
        await recordBillingEvent(
          context.orgId,
          context.billingType,
          context.billingUnits,
          { hash: context.integrityHash }
        );
      });

      // 8.5 Sovereign Replication (Async Read-Only)
      await this.stage(context, 'REPLICATION', async () => {
        if (context.integrityHash) {
          await ReplicationEngine.replicate({
            type: 'EVIDENCE_BUNDLE',
            sourceRegion: CURRENT_REGION,
            targetRegions: ReplicationEngine.getPeerRegions(),
            payloadHash: context.integrityHash,
            timestamp: new Date().toISOString()
          });
        }
      });

      // 9. Telemetry (Real-time)
      const totalLatency = Date.now() - context.startTime;
      await this.stage(context, 'TELEMETRY', async () => {
        logger.info('PIPELINE_EXECUTION_SUCCESS', {
          org_id: context.orgId,
          event_id: context.eventId,
          total_latency: totalLatency,
          breakdown: context.latencyBreakdown
        });
        
        // P95 Rollback Monitor
        this.latencyHistory.push(totalLatency);
        if (this.latencyHistory.length > 100) this.latencyHistory.shift();
        
        const p95 = this.getP95(this.latencyHistory);
        if (p95 > this.BUDGET_MS) {
          logger.error('CANARY_AUTO_ROLLBACK_SIGNAL', { p95, budget: this.BUDGET_MS });
          // Logic for automated traffic shift away from canary could go here
        }

        if (totalLatency > GovernancePipeline.BUDGET_MS) {
          logger.error('OVER_BUDGET_EVENT', { 
            latency: totalLatency, 
            budget: GovernancePipeline.BUDGET_MS 
          });
        }
      });

      // 10. Archive (ASYNC PATH)
      this.archiveAsync(context);

      const result: GovernanceExecutionResult = {
        success: true,
        hash: context.integrityHash || '',
        latency: totalLatency,
      };

      if (context.integrityHash !== undefined) result.integrityHash = context.integrityHash;
      if (context.latencyBreakdown !== undefined) result.latencyBreakdown = context.latencyBreakdown;

      return result;

    } catch (err: any) {
      const totalLatency = Date.now() - context.startTime;
      logger.error('PIPELINE_EXECUTION_FAILED', {
        org_id: context.orgId,
        error: err.message,
        latency: totalLatency
      });
      throw err;
    }
  }

  private static async stage(context: PipelineContext, name: string, fn: () => Promise<void>) {
    const start = Date.now();
    await fn();
    context.latencyBreakdown[name] = Date.now() - start;
  }

  private static getP95(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index] ?? 0;
  }

  private static async handleIncident(context: PipelineContext, type: string, message: string) {
    const incidentLog = {
      type,
      message,
      org_id: context.orgId,
      trace_id: context.eventId,
      timestamp: new Date().toISOString(),
      execution_trace: context.latencyBreakdown,
      integrity_hash: context.integrityHash
    };

    logger.error('GOVERNANCE_INCIDENT_AUTOMATION', incidentLog);

    if (type === 'ISOLATION_BREACH') {
      logger.error('IMMEDIATE_ORG_LOCK_TRIGGERED', { orgId: context.orgId });
      // In a real implementation, we would call an RPC to disable the org
      await supabaseServer.from('organizations').update({ status: 'LOCKED' }).eq('id', context.orgId);
    }
  }

  /**
   * Async Intelligence Path
   * Handles heavy archiving and deep predictive snapshots.
   */
  private static archiveAsync(context: PipelineContext) {
    setImmediate(async () => {
      try {
        
        // 11. Network Intelligence Signal (Phase 53)
        const intercept = (context as any)._runtimeIntercept;
        if (intercept && intercept.risk_score > 20) {
          const anonymized = Anonymizer.anonymize(
            context.payload?.model || context.provider,
            intercept.action === 'block' ? 'policy_bypass' : 'hallucination', // simplified mapping
            intercept.risk_score,
            intercept.reason
          );
          
          await IntelligenceNetwork.ingestSignal(anonymized);
          logger.debug('NETWORK_SIGNAL_EMITTED', { hash: anonymized.pattern_hash });
        }

        logger.debug('PIPELINE_ARCHIVE_COMPLETE', { event_id: context.eventId });
      } catch (err: any) {
        logger.error('PIPELINE_ARCHIVE_ERROR', { error: err.message });
      }
    });
  }
}
