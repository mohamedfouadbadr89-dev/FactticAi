import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import { authorizeOrgAccess } from '@/lib/security/authorizeOrgAccess';
import { logger } from '@/lib/logger';
import { classify } from './llmClassifier';
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
        const { org_id, user_id, session_id, prompt, client_sent_at, playground_mode, timeout_ms } = params;
        const start = performance.now();
        const sessionId = session_id || crypto.randomUUID();
        
        // Increase budget to handle LLM-based classification (Phase 50)
        const timeoutBudget = timeout_ms || 10000;
        console.log(`LATENCY_BUDGET_UPDATED_TO_${timeoutBudget}`);
        
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
            logger.error('PIPELINE_CRITICAL_FAILURE', { error: err.message, stack: err.stack });
            console.error(`PIPELINE_CRITICAL_FAILURE: ${err.message}`, err.stack);
            
            const failResult: GovernanceExecutionResult = {
                success: true,
                session_id: sessionId,
                decision: 'BLOCK',
                risk_score: 100,
                violations: [{ 
                    policy_name: 'Fail-Closed', 
                    rule_type: err.message === 'GOVERNANCE_TIMEOUT' ? 'timeout' : 'failure', 
                    action: 'block' 
                }],
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
        const { org_id, prompt, response, voice_latency_ms, voice_collision_index, voice_barge_in_detected } = params;
        
        // Parallel execution of standard modules and LLM-based classification
        const [policiesRes, classification] = await Promise.all([
            supabase.from('governance_policies').select('*').eq('org_id', org_id).abortSignal(signal),
            classify(response || prompt, response ? 'response' : 'prompt', org_id, sessionId)
        ]);

        const policies = policiesRes.data || [];
        const contentToEvaluate = response || prompt;
        
        const policyResult = PolicyEvaluator.evaluate(contentToEvaluate, policies);
        const guardrailResult = GuardrailDetector.evaluate(contentToEvaluate, "");
        
        // Combine static scoring with LLM-based classification (Phase 50 Upgrade)
        let riskScore = Math.max(
            RiskScorer.computeScore(policyResult, guardrailResult),
            classification.risk_score
        );

        if (voice_latency_ms && voice_latency_ms > 800) riskScore += 10;
        if (voice_collision_index && voice_collision_index > 0.2) riskScore += 15;
        if (voice_barge_in_detected) riskScore += 20;
        
        riskScore = Math.min(riskScore, 100);

        // Merge violations from both sources
        const violations = [...policyResult.violations];
        if (classification.risk_score >= 60 || Object.values(classification.flags).some(Boolean)) {
            violations.push({
                policy_name: 'AI Governance Classifier',
                rule_type: 'llm_safety',
                action: classification.decision.toLowerCase(),
                metadata: { ...classification.flags, explanation: classification.explanation }
            });
        }

        // NEW CALIBRATED DECISION LOGIC (Phase 65)
        let decision: PipelineDecision = 'ALLOW';
        if (riskScore >= 85) {
            decision = 'BLOCK';
        } else if (riskScore >= 60) {
            decision = 'WARN';
        }
        
        return { 
            success: true, 
            session_id: sessionId, 
            decision, 
            risk_score: riskScore, 
            violations,
            behavior: { ...guardrailResult.metrics, ...classification.flags }
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

            // Fill Escalation Logs (Fix ISSUE 1: Alerts page empty)
            if (result.decision === 'BLOCK' || result.decision === 'WARN') {
                await supabase.from('governance_alerts').insert({
                    org_id: params.org_id,
                    title: result.violations?.[0]?.policy_name || 'Policy Violation',
                    description: result.violations?.[0]?.metadata?.cause || `Governance signal: ${result.decision}`,
                    severity: result.decision === 'BLOCK' ? 'critical' : 'warning',
                    interaction_id: sessionId,
                    created_at: new Date().toISOString()
                });
            }

            // Create incident for high-risk blocks (Fix 3: Synchronize Incidents Page)
            if (result.decision === 'BLOCK' && result.risk_score > 70) {
                await supabase.from('incidents').insert({
                    org_id: params.org_id,
                    session_id: sessionId,
                    risk_score: result.risk_score,
                    decision: result.decision,
                    violation: result.violations?.[0]?.policy_name || 'Governance Violation',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (e) { console.error('Persistence failed', e); }
    }
}