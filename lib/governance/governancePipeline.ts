import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { DriftDetector } from './modules/driftDetector';
import { IncidentCreator } from './modules/incidentCreator';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import crypto from 'crypto';

export class GovernancePipeline {
    static async execute(params: { 
        org_id: string, 
        session_id?: string, 
        prompt: string, 
        response?: string, 
        model?: string,
        voice_latency_ms?: number,
        voice_collision_index?: number,
        voice_barge_in_detected?: boolean
    }) {
        const { org_id, session_id, prompt, response, model = 'facttic-governance-engine', voice_latency_ms, voice_collision_index, voice_barge_in_detected } = params;
        
        // 1. Precise Start Time
        const start = performance.now();
        const t0 = Date.now();
        const sessionId = session_id || crypto.randomUUID();

        try {
            // Load necessary external state for pure functions
            const { data: policies } = await supabase.from('governance_policies').select('*').eq('org_id', org_id);
            const { data: history } = await supabase.from('facttic_governance_events')
                .select('risk_score')
                .eq('org_id', org_id)
                .order('created_at', { ascending: false })
                .limit(10);
            const historyScores = (history || []).map(h => h.risk_score);

            // -- Execution Steps --
            const policyResult = PolicyEvaluator.evaluate(prompt, policies || []);
            const guardrailResult = GuardrailDetector.evaluate(prompt, response);
            let riskScore = RiskScorer.computeScore(policyResult, guardrailResult);

            const voice_modifiers: any = {};
            if (voice_latency_ms !== undefined && voice_latency_ms > 800) {
                riskScore += 0.05;
                voice_modifiers.voice_latency_ms = voice_latency_ms;
                voice_modifiers.latency_penalty = 0.05;
            }
            if (voice_collision_index !== undefined && voice_collision_index > 0.2) {
                riskScore += 0.10;
                voice_modifiers.voice_collision_index = voice_collision_index;
                voice_modifiers.collision_penalty = 0.10;
            }
            if (voice_barge_in_detected === true) {
                riskScore += 0.15;
                voice_modifiers.voice_barge_in_detected = true;
                voice_modifiers.barge_in_penalty = 0.15;
            }
            riskScore = Math.min(riskScore, 100);
            const driftResult = DriftDetector.detect(riskScore, historyScores);
            const incidentResult = IncidentCreator.evaluateIncident(riskScore, driftResult);

            if (incidentResult.create_incident) {
                await supabase.from('incidents').insert({
                    org_id,
                    session_id: sessionId,
                    severity: incidentResult.severity,
                    violation_type: incidentResult.incident_type,
                    timestamp: new Date().toISOString()
                });
            }

            const decision = riskScore >= 80 ? 'BLOCK' : riskScore >= 40 ? 'WARN' : 'ALLOW';
            const violations = policyResult.violations.length > 0 ? policyResult.violations : [];

            // 2. Compute Precision Latency (Internal Logic Execution)
            const duration = Math.round(performance.now() - start);

            // 3. Evidence Ledger Recording (Forensic Ledger + Tamper-Evidence)
            const ledgerResult = await EvidenceLedger.write({
                org_id,
                session_id: sessionId,
                event_type: 'governance_evaluation',
                decision,
                risk_score: riskScore,
                prompt,
                model,
                guardrail_signals: guardrailResult.signals,
                violations,
                latency: duration
            });

            if (Object.keys(voice_modifiers).length > 0) {
                await supabase.from('facttic_governance_events')
                    .update({ metadata: voice_modifiers })
                    .eq('id', ledgerResult.event_id);
            }

            // 4. Audit Log Recording (Observability Signal)
            // Even if the decision is BLOCK, we record the latency here.
            await supabase.from('audit_logs').insert({
                org_id,
                action: 'GOVERNANCE_EXECUTION',
                metadata: {
                  processing_ms: duration,
                  model,
                  decision,
                  risk_score: riskScore,
                  session_id: sessionId
                }
            });

            // 5. Telemetry Broadcast (Optimized for Realtime)
            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                    messages: [{
                        topic: `governance:${org_id}`,
                        event: 'governance_event',
                        payload: { 
                            session_id: sessionId, 
                            decision, 
                            risk_score: riskScore, 
                            latency: duration, 
                            timestamp: new Date().toISOString() 
                        }
                    }]
                })
            }).catch(err => console.error('Telemetry broadcast failed:', err));

            return {
                success: true,
                session_id: sessionId,
                decision,
                risk_score: riskScore,
                violations,
                incident: incidentResult.create_incident ? incidentResult : null,
                latency: duration
            };

        } catch (err: any) {
            console.error('Governance execution crash:', err);
            
            // Record failure in audit logs even on crash
            const crashDuration = Math.round(performance.now() - start);
            void supabase.from('audit_logs').insert({
                org_id,
                action: 'GOVERNANCE_CRASH',
                metadata: {
                    error: err.message,
                    processing_ms: crashDuration,
                    session_id: sessionId
                }
            });

            throw err;
        }
    }
}
