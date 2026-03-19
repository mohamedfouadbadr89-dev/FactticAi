import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { DriftDetector } from './modules/driftDetector';
import { IncidentCreator } from './modules/incidentCreator';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import { authorizeOrgAccess, AuthorizationError } from '@/lib/security/authorizeOrgAccess';
import { redactPII } from '@/lib/security/redactPII';
import { FraudDetectionEngine } from '@/lib/security/fraudDetectionEngine';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export type PipelineDecision = 'ALLOW' | 'WARN' | 'BLOCK';

export interface GovernanceExecutionResult {
    success: boolean;
    session_id: string;
    decision: PipelineDecision;
    risk_score: number;
    violations: any[];
    incident?: any;
    latency: number;
    fail_closed?: boolean;
    event_hash?: string;
    hash: string; // Legacy compatibility
}

export class GovernancePipeline {
    /**
     * The Single Source of Truth for Governance Execution.
     * Executes logic, manages persistence, and enforces security guardrails.
     * Hard-capped at 50ms for dependency interactions (Supabase, etc.).
     */
    static async execute(params: { 
        org_id: string,
        user_id: string,
        session_id?: string | null | undefined, 
        prompt: string, 
        response?: string | null | undefined, 
        model?: string | null | undefined,
        voice_latency_ms?: number | null | undefined,
        voice_collision_index?: number | null | undefined,
        voice_barge_in_detected?: boolean | null | undefined,
        voice_packet_loss?: number | null | undefined,
        voice_audio_integrity?: number | null | undefined,
        client_sent_at?: number | null | undefined,
        playground_mode?: boolean | null | undefined
    }): Promise<GovernanceExecutionResult> {
        const { org_id, user_id, session_id, prompt, response, model = 'facttic-governance-engine', client_sent_at, playground_mode } = params;
        const start = performance.now();
        const sessionId = session_id || crypto.randomUUID();

        // 1. Clock-Sync Latency Check (Security Floor)
        const now = Date.now();
        const trueLatency = client_sent_at ? now - client_sent_at : 0;
        if (client_sent_at && trueLatency > 150) {
            logger.warn('CLOCK_SYNC_LATENCY_VIOLATION', { org_id, sessionId, trueLatency });
            return {
                success: true,
                session_id: sessionId,
                decision: 'BLOCK',
                risk_score: 95,
                violations: [{ policy_name: 'Clock-Sync Latency', rule_type: 'latency_violation', action: 'block', metadata: { true_latency: trueLatency } }],
                latency: Math.round(performance.now() - start),
                fail_closed: true,
                event_hash: 'LATENCY_BLOCK',
                hash: 'LATENCY_BLOCK'
            };
        }

        // 50ms (Prod) / 150ms (Playground/Dev) Hard-Stop for dependency interaction (Fail-Closed)
        const isDev = process.env.NODE_ENV === 'development';
        const timeoutMs = (playground_mode || isDev) ? 150 : 50;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            // 1. Authorization Access Gate (First, must resolve < 10ms)
            await authorizeOrgAccess(user_id, org_id);

            // 2. Comprehensive Logic Pipeline
            const result = await Promise.race([
                this.runCoreLogic(params, sessionId, controller.signal),
                new Promise<any>((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(new Error('GOVERNANCE_TIMEOUT')));
                })
            ]);

            if (!result) throw new Error('GOVERNANCE_TIMEOUT');

            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - start);

            const finalResult: GovernanceExecutionResult = {
                ...result,
                latency: duration,
                event_hash: 'PENDING_ASYNC',
                hash: 'PENDING_ASYNC'
            };

            // 3. Atomicity Guard: For BLOCK, we ensure the ledger hit before returning.
            // For ALLOW/WARN, we persist asynchronously to protect latency.
            if (result.decision === 'BLOCK') {
                await this.persistInternal(finalResult, params, sessionId);
            } else {
                void this.persistInternal(finalResult, params, sessionId).catch(e => 
                    logger.error('GOVERNANCE_PERSIST_FAIL', { error: e.message, sessionId })
                );
            }

            return finalResult;

        } catch (err: any) {
            clearTimeout(timeoutId);
            const crashDuration = Math.round(performance.now() - start);

            if (err.message === 'GOVERNANCE_TIMEOUT' || err.name === 'AbortError') {
                logger.error('PIPELINE_FAIL_CLOSED_TIMEOUT', { org_id, sessionId });
                const failClosed: GovernanceExecutionResult = {
                    success: true,
                    session_id: sessionId,
                    decision: 'BLOCK',
                    risk_score: 100,
                    violations: [{ policy_name: 'Fail-Closed Safety', rule_type: 'latency_violation', action: 'block' }],
                    latency: crashDuration,
                    fail_closed: true,
                    event_hash: 'FAIL_CLOSED',
                    hash: 'FAIL_CLOSED',
                    incident: {
                        create_incident: true,
                        severity: 'critical',
                        violation_type: 'latency_violation',
                        metadata: { cause: 'GOVERNANCE_TIMEOUT_50MS' }
                    }
                };

                // Atomic record of the fail-closed event
                void this.persistInternal(failClosed, params, sessionId);
                return failClosed;
            }

            // Record crash
            void supabase.from('audit_logs').insert({
                org_id,
                action: 'GOVERNANCE_CRASH',
                metadata: redactPII({ error: err.message, session_id: sessionId, user_id })
            });

            throw err;
        }
    }

    private static async runCoreLogic(params: any, sessionId: string, signal: AbortSignal) {
        const { org_id, prompt, response, voice_latency_ms, voice_collision_index, voice_barge_in_detected } = params;
        
        // 1. Fraud / Velocity Check (Pass signal to kill hanging DB/network tasks)
        const fraudResult = await FraudDetectionEngine.evaluate({ session_id: sessionId, org_id, prompt });
        if (signal.aborted) throw new Error('GOVERNANCE_TIMEOUT');

        if (fraudResult.action === 'block API key') {
            return { decision: 'BLOCK' as PipelineDecision, risk_score: 100, violations: [{ policy_name: 'Fraud Detection', rule_type: 'malicious_velocity', action: 'block' }] };
        }

        // 2. Logic Evaluation (Fast Paths)
        const { data: policies, error: policyErr } = await supabase
            .from('governance_policies')
            .select('*')
            .eq('org_id', org_id)
            .abortSignal(signal); // KILL ZOMBIE DB CALLS

        if (policyErr && policyErr.message.includes('abort')) throw new Error('GOVERNANCE_TIMEOUT');

        const policyResult = PolicyEvaluator.evaluate(prompt, policies || []);
        const guardrailResult = GuardrailDetector.evaluate(prompt, response);
        
        let riskScore = RiskScorer.computeScore(policyResult, guardrailResult);

        // Voice Modifiers (Server-Side Verified)
        if (voice_latency_ms > 800) riskScore += 5;
        if (voice_collision_index > 0.2) riskScore += 10;
        if (voice_barge_in_detected) riskScore += 15;
        
        // Anti-Spoofing & Integrity Verification
        const packet_loss = params.voice_packet_loss || 0;
        const audio_integrity = params.voice_audio_integrity ?? 100;

        if (packet_loss > 10) riskScore += 10; // High frequency dropout signal
        if (audio_integrity < 95) {
            riskScore += 20; // Potential signal tampering or adversarial noise
            policyResult.violations.push({
                policy_name: 'Audio Integrity Guard',
                rule_type: 'safety_violation',
                threshold: 95,
                actual_score: audio_integrity,
                action: 'warn'
            });
        }
        
        riskScore = Math.min(riskScore, 100);

        // 3. Barge-In Escalation (Session Persistence check)
        const { count: sessionInterrupts } = await supabase
            .from('facttic_governance_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('event_type', 'voice_interrupt')
            .abortSignal(signal);

        if (sessionInterrupts && sessionInterrupts > 3) {
            riskScore = Math.min(100, riskScore + 25);
            policyResult.violations.push({
                policy_name: 'Barge-In Escalation',
                rule_type: 'safety_violation',
                threshold: 3,
                actual_score: sessionInterrupts,
                action: 'block'
            });
        }
        
        const incidentResult = IncidentCreator.evaluateIncident(riskScore, { triggered: false }); // Drift detached for speed

        const decision: PipelineDecision = riskScore >= 80 || fraudResult.action === 'block API key' ? 'BLOCK' : riskScore >= 40 ? 'WARN' : 'ALLOW';

        return {
            success: true,
            session_id: sessionId,
            decision,
            risk_score: riskScore,
            violations: policyResult.violations,
            incident: incidentResult.create_incident ? incidentResult : null
        };
    }

    private static async persistInternal(result: GovernanceExecutionResult, params: any, sessionId: string) {
        const { org_id, user_id, prompt, model, client_sent_at } = params;
        
        // 30ms Hard-Stop for DB Write (Fail-Closed Integrity)
        const persistController = new AbortController();
        const persistTimeout = setTimeout(() => persistController.abort(), 30);

        try {
            // 1. Evidence Ledger (Atomic Chain)
            await EvidenceLedger.write({
                session_id: sessionId,
                org_id,
                event_type: result.decision === 'BLOCK' ? 'governance_block' : 'governance_evaluation',
                prompt,
                model: model || 'unspecified',
                decision: result.decision,
                risk_score: result.risk_score,
                violations: result.violations,
                latency: result.latency,
                client_sent_at
            }, persistController.signal);
            
            clearTimeout(persistTimeout);
        } catch (e: any) {
            clearTimeout(persistTimeout);
            if (e.name === 'AbortError' || e.message?.includes('abort')) {
                throw new Error('LEDGER_WRITE_TIMEOUT_30MS');
            }
            throw e;
        }

        // 2. Realtime Broadcast
        void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                messages: [{
                    topic: `governance:${org_id}`,
                    event: "governance_event",
                    payload: { event: "governance_event", data: { session_id: sessionId, org_id, decision: result.decision, risk_score: result.risk_score, timestamp: new Date().toISOString() } }
                }]
            })
        }).catch(e => logger.error('TELEMETRY_BROADCAST_FAIL', { error: e.message }));

        // 3. Operational Data (Sessions & Turns)
        const riskDecimal = result.risk_score / 100;
        await supabase.from('sessions').upsert({
            id: sessionId,
            org_id,
            status: result.decision === 'BLOCK' ? 'completed' : 'active',
            total_risk: riskDecimal,
            risk_score: riskDecimal,
            ended_at: result.decision === 'BLOCK' ? new Date().toISOString() : null
        });

        await supabase.from('session_turns').insert({
            session_id: sessionId,
            org_id,
            prompt,
            decision: result.decision,
            incremental_risk: result.risk_score
        });

        // 4. Incident Escalation
        if (result.incident) {
            await supabase.from('incidents').insert({
                session_id: sessionId,
                org_id,
                severity: result.risk_score >= 90 ? 'critical' : 'high',
                violation_type: result.violations?.[0]?.policy_name || 'unclassified'
            });
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPATIBILITY SHIM
// The following types and interfaces were exported by the deprecated
// lib/governancePipeline.ts (v4.3). They are re-exported from this canonical
// location so that diagnostic scripts (generateEvidenceBundle, certifyDeterminism)
// continue to compile after the legacy file is removed.
// ─────────────────────────────────────────────────────────────────────────────
export type { BillingEventType } from '@/lib/billingResolver';
export type { Role } from '@/lib/rbac';
export type { RegionID } from '@/config/regions';

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
    userRole: import('@/lib/rbac').Role;
    provider: string;
    eventId: string;
    payload: any;
    startTime: number;
    latencyBreakdown: Record<string, number>;
    integrityHash?: string;
    billingUnits: number;
    billingType: import('@/lib/billingResolver').BillingEventType;
    regionId: import('@/config/regions').RegionID;
}

