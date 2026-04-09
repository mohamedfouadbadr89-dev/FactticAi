import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import { GovernanceAlertEngine } from './alertEngine';
import { authorizeOrgAccess } from '@/lib/security/authorizeOrgAccess';
import { classify } from './llmClassifier';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export type PipelineDecision = 'ALLOW' | 'WARN' | 'BLOCK';

export interface GovernanceExecutionResult {
    success: boolean;
    session_id: string;
    decision: PipelineDecision;
    risk_score: number;
    violations: any[];
    behavior?: any;
    latency: number;
    fail_closed?: boolean;
    event_hash?: string;
    hash: string;
}

export class GovernancePipeline {
    static async execute(params: { 
        org_id: string,
        user_id: string,
        session_id?: string | null, 
        prompt: string, 
        response?: string | null | undefined, 
        model?: string | null | undefined,
        client_sent_at?: number | null,
        playground_mode?: boolean | null,
        voice_latency_ms?: number | null,
        voice_packet_loss?: number | null,
        voice_audio_integrity?: number | null,
        voice_collision_index?: number | null,
        voice_barge_in_detected?: boolean | null,
        timeout_ms?: number | null
    }): Promise<GovernanceExecutionResult> {
        console.log("LATENCY_BUDGET_UPDATED_TO_2000");
        const { org_id, user_id, session_id, prompt, client_sent_at, playground_mode, timeout_ms } = params;
        const start = performance.now();
        const sessionId = session_id || crypto.randomUUID();
        const timeoutBudget = 2000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutBudget);

        try {
            await authorizeOrgAccess(user_id, org_id);
            const result = await Promise.race([
                this.runCoreLogic(params, sessionId, controller.signal),
                new Promise<any>((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(new Error('GOVERNANCE_TIMEOUT')));
                })
            ]);
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - start);
            const finalResult: GovernanceExecutionResult = {
                ...result,
                latency: duration,
                event_hash: 'ASYNC_PROCESSED',
                hash: 'ASYNC_PROCESSED'
            };
            if (result.decision === 'BLOCK') {
                await this.persistInternal(finalResult, params, sessionId);
            } else {
                void this.persistInternal(finalResult, params, sessionId).catch(e => logger.error('PERSIST_ERR', {e}));
            }
            return finalResult;
        } catch (err: any) {
            clearTimeout(timeoutId);
            const failResult: GovernanceExecutionResult = {
                success: true,
                session_id: sessionId,
                decision: 'BLOCK',
                risk_score: 100,
                violations: [{ policy_name: 'Fail-Closed', rule_type: 'timeout', action: 'block' }],
                latency: Math.round(performance.now() - start),
                fail_closed: true,
                event_hash: 'FAIL_CLOSED',
                hash: 'FAIL_CLOSED'
            };
            void this.persistInternal(failResult, params, sessionId);
            return failResult;
        }
    }

    private static async runCoreLogic(params: any, sessionId: string, signal: AbortSignal) {
        const { org_id, prompt, voice_latency_ms, voice_collision_index, voice_barge_in_detected } = params;

        // ── Layer 1: Rule-based (fast, deterministic) ─────────────────────────
        const { data: policies } = await supabase.from('governance_policies').select('*').eq('org_id', org_id).abortSignal(signal);
        const policyResult = PolicyEvaluator.evaluate(prompt, policies || []);
        const guardrailResult = GuardrailDetector.evaluate(prompt, "");
        let riskScore = RiskScorer.computeScore(policyResult, guardrailResult);
        if (voice_latency_ms && voice_latency_ms > 800) riskScore += 10;
        if (voice_collision_index && voice_collision_index > 0.2) riskScore += 15;
        if (voice_barge_in_detected) riskScore += 20;
        riskScore = Math.min(riskScore, policyResult.score_ceiling ?? 100);

        // ── Layer 2: LLM classifier (context-aware, ambiguous zone only) ──────
        // Only invoked when rule-based lands in the uncertain middle (25–79).
        // Clear ALLOW (<25) and clear BLOCK (≥80) skip LLM to preserve latency.
        let llmFlags: any = null;
        if (riskScore >= 25 && riskScore < 80 && !signal.aborted) {
            try {
                const llmResult = await Promise.race([
                    classify(prompt, 'prompt', org_id, sessionId),
                    // Respect the remaining pipeline budget — never exceed 1500ms for LLM
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
                ]);
                if (llmResult && !signal.aborted) {
                    // Conservative merge: take the higher risk score
                    riskScore = Math.max(riskScore, llmResult.risk_score);
                    riskScore = Math.min(riskScore, policyResult.score_ceiling ?? 100);
                    llmFlags = llmResult.flags;
                    logger.info('LLM_CLASSIFIER_APPLIED', {
                        session_id: sessionId,
                        org_id,
                        llm_score: llmResult.risk_score,
                        final_score: riskScore,
                        decision: llmResult.decision,
                    });
                }
            } catch {
                // LLM failed — rule-based result stands, no disruption
            }
        }

        // ── Layer 3: Response-level governance (if response provided) ────────────
        // Evaluate the AI's actual response for sensitive content leaks.
        let responseViolations: any[] = [];
        if (params.response && params.response.trim().length > 0) {
            const responseGuardrail = GuardrailDetector.evaluate('', params.response);
            const responsePolicies = PolicyEvaluator.evaluate(params.response, policies || []);
            const responseRisk = RiskScorer.computeScore(responsePolicies, responseGuardrail);
            if (responseRisk > riskScore) {
                riskScore = Math.min(responseRisk, policyResult.score_ceiling ?? 100);
                responseViolations = responsePolicies.violations;
            }
        }

        const decision: PipelineDecision = riskScore >= 80 ? 'BLOCK' : riskScore >= 40 ? 'WARN' : 'ALLOW';
        return {
            success: true,
            session_id: sessionId,
            decision,
            risk_score: riskScore,
            violations: [...policyResult.violations, ...responseViolations],
            behavior: { ...guardrailResult.metrics, llm_flags: llmFlags },
        };
    }

    private static async persistInternal(result: any, params: any, sessionId: string) {
        // EvidenceLedger is isolated — if GOVERNANCE_SECRET is missing or the
        // append_governance_ledger RPC doesn't exist, it must NOT block the
        // writes to sessions / incidents / governance_alerts which power the UI.
        void EvidenceLedger.write({
            session_id: sessionId,
            org_id: params.org_id,
            event_type: 'governance_eval',
            prompt: params.prompt,
            model: params.model || 'facttic-v5',
            decision: result.decision,
            risk_score: result.risk_score,
            violations: result.violations,
            latency: result.latency
        }).catch(e => logger.error('EVIDENCE_LEDGER_WRITE_FAILED', { sessionId, error: e?.message }));

        // Each write is independent — one failure must NOT block the others

        // session_turns — raw turn log
        void supabase.from('session_turns').insert({
            session_id: sessionId,
            org_id: params.org_id,
            prompt: params.prompt,
            decision: result.decision,
            incremental_risk: result.risk_score,
            turn_index: 1
        }).then(({ error }) => { if (error) logger.warn('SESSION_TURNS_WRITE_FAILED', { sessionId, error: error.message }); });

        // sessions — dashboard Sessions Today counter (most important write)
        const now = new Date().toISOString();
        supabase.from('sessions').upsert({
            id: sessionId,
            org_id: params.org_id,
            total_risk: result.risk_score,
            decision: result.decision,
            status: result.decision === 'BLOCK' ? 'blocked' : 'completed',
            started_at: now,
            ended_at: now,
            created_at: now
        }, { onConflict: 'id' }).then(({ error }) => {
            if (error) {
                // Fallback: write only guaranteed columns (id, org_id, created_at)
                logger.warn('SESSIONS_UPSERT_FULL_FAILED', { sessionId, error: error.message });
                return supabase.from('sessions').upsert(
                    { id: sessionId, org_id: params.org_id, created_at: now },
                    { onConflict: 'id' }
                ).then(({ error: e2 }) => {
                    if (e2) logger.error('SESSIONS_UPSERT_MINIMAL_FAILED', { sessionId, error: e2.message });
                    else logger.info('SESSION_WRITTEN_MINIMAL', { sessionId, org_id: params.org_id });
                });
            }
            logger.info('SESSION_WRITTEN', { sessionId, org_id: params.org_id, decision: result.decision });
        });

        // incidents — BLOCK or high-risk events only
        if (result.decision === 'BLOCK' || result.risk_score >= 70) {
            const violation = result.violations?.[0];
            void supabase.from('incidents').insert({
                org_id: params.org_id,
                session_id: sessionId,
                title: violation?.policy_name
                    ? `Policy Violation: ${violation.policy_name}`
                    : `Governance Block — Risk ${result.risk_score}`,
                description: violation?.reason
                    ?? `Decision: ${result.decision} | Risk: ${result.risk_score}/100`,
                risk_score: result.risk_score,
                decision: result.decision,
                status: 'open',
                timestamp: now,
                created_at: now
            }).then(({ error }) => { if (error) logger.warn('INCIDENT_INSERT_FAILED', { sessionId, error: error.message }); });
        }

        // governance_alerts — BLOCK or risk >= 60
        if (result.decision === 'BLOCK' || result.risk_score >= 60) {
            GovernanceAlertEngine.triggerAlert({
                org_id: params.org_id,
                alert_type: result.decision === 'BLOCK' ? 'policy_block' : 'high_risk',
                severity: result.risk_score >= 80 ? 'critical' : 'warning',
                metadata: {
                    session_id: sessionId,
                    risk_score: result.risk_score,
                    decision: result.decision,
                    violations: result.violations,
                    reason: result.violations?.[0]?.reason ?? null
                }
            });
        }
    }
}