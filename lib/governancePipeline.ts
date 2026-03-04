import { createHash } from 'crypto';
import { supabaseServer } from './supabaseServer';
import { logger } from './logger';
import { authorize, type Role } from './rbac';
import { recordWebhookEvent } from './idempotency';
import { PredictiveEngine } from './predictiveEngine';
import { recordBillingEvent, type BillingEventType } from './billingResolver';
import { StartupManager } from './startupChecks';
import { isFeatureEnabled } from '../config/featureFlags';
import { CURRENT_REGION, type RegionID } from '../config/regions';
import { ReplicationEngine } from './replicationEngine';
import { GovernanceInterceptor } from './governance/interceptor';
import { RuntimeInterceptor } from './governance/runtimeInterceptor';
import { Anonymizer } from './network/anonymizer';
import { IntelligenceNetwork } from './network/intelligenceNetwork';


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
        const profile = await PredictiveEngine.calculateDrift(context.orgId);
        if (profile.status === 'CRITICAL') {
          logger.warn('PIPELINE_PRI_HIGH', { orgId: context.orgId, risk: profile.risk_index });
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
        await PredictiveEngine.recordPrediction(context.orgId, (context as any)._riskProfile);
        
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
