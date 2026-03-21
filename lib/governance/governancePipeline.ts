import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import { authorizeOrgAccess } from '@/lib/security/authorizeOrgAccess';
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
        const { data: policies } = await supabase.from('governance_policies').select('*').eq('org_id', org_id).abortSignal(signal);
        const policyResult = PolicyEvaluator.evaluate(prompt, policies || []);
        const guardrailResult = GuardrailDetector.evaluate(prompt, "");
        let riskScore = RiskScorer.computeScore(policyResult, guardrailResult);
        if (voice_latency_ms && voice_latency_ms > 800) riskScore += 10;
        if (voice_collision_index && voice_collision_index > 0.2) riskScore += 15;
        if (voice_barge_in_detected) riskScore += 20;
        // Respect score_ceiling from PolicyEvaluator — executive PII max 92, others 100
        riskScore = Math.min(riskScore, policyResult.score_ceiling ?? 100);
        const decision: PipelineDecision = riskScore >= 80 ? 'BLOCK' : riskScore >= 40 ? 'WARN' : 'ALLOW';
        return { 
            success: true, 
            session_id: sessionId, 
            decision, 
            risk_score: riskScore, 
            violations: policyResult.violations,
            behavior: guardrailResult.metrics
        };
    }

    private static async persistInternal(result: any, params: any, sessionId: string) {
        try {
            await EvidenceLedger.write({
                session_id: sessionId,
                org_id: params.org_id,
                event_type: 'governance_eval',
                prompt: params.prompt,
                model: params.model || 'facttic-v5',
                decision: result.decision,
                risk_score: result.risk_score,
                violations: result.violations,
                latency: result.latency
            });
            await supabase.from('session_turns').insert({
                session_id: sessionId,
                org_id: params.org_id,
                prompt: params.prompt,
                decision: result.decision,
                incremental_risk: result.risk_score
            });
        } catch (e) { console.error('Persistence failed', e); }
    }
}