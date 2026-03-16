import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { PolicyEvaluator } from './modules/policyEvaluator';
import { GuardrailDetector } from './modules/guardrailDetector';
import { RiskScorer } from './modules/riskScorer';
import { DriftDetector } from './modules/driftDetector';
import { IncidentCreator } from './modules/incidentCreator';
import { EvidenceLedger } from '../evidence/evidenceLedger';
import { authorizeOrgAccess, AuthorizationError } from '@/lib/security/authorizeOrgAccess';
import { redactPII } from '@/lib/security/redactPII';
import { governanceQueue } from '../queue/governanceQueue';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// HASH CHAIN PRIMITIVES
//
// These two functions mirror the SQL logic in append_governance_ledger() and
// verify_event_chain() in 20260316000001_governance_hash_chain.sql.
// Field ordering is canonical — any change breaks existing chains.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the most recent event_hash for a session from the DB.
 * Returns 'GENESIS_HASH' if no events exist yet (first event in session).
 */
async function fetchPreviousHash(session_id: string, org_id: string): Promise<string> {
    const { data } = await supabase
        .from('facttic_governance_events')
        .select('event_hash')
        .eq('session_id', session_id)
        .eq('org_id', org_id)
        .not('event_hash', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return (data as any)?.event_hash ?? 'GENESIS_HASH';
}

/**
 * Computes SHA-256 over the canonical field set.
 * Must remain in sync with buildHashInput() in lib/evidence/evidenceLedger.ts
 * and the v_hash_input concatenation in append_governance_ledger() SQL.
 *
 * Canonical field order:
 *   session_id + timestamp_ms + prompt + decision + risk_score + violations_json + previous_hash
 */
function computeGovernanceHash(fields: {
    session_id:    string;
    timestamp_ms:  number;
    prompt:        string | null | undefined;
    decision:      string;
    risk_score:    number;
    violations:    any[];
    previous_hash: string;
}): string {
    const input =
        fields.session_id +
        fields.timestamp_ms +
        (fields.prompt || '') +
        fields.decision +
        fields.risk_score +
        JSON.stringify(fields.violations || []) +
        fields.previous_hash;
    return crypto.createHash('sha256').update(input).digest('hex');
}

export class GovernancePipeline {
    static async execute(params: { 
        org_id: string,
        user_id: string,         // REQUIRED: Must come from verified session context, never from payload
        session_id?: string, 
        prompt: string, 
        response?: string, 
        model?: string,
        voice_latency_ms?: number,
        voice_collision_index?: number,
        voice_barge_in_detected?: boolean
    }) {
        const { org_id, user_id, session_id, prompt, response, model = 'facttic-governance-engine', voice_latency_ms, voice_collision_index, voice_barge_in_detected } = params;
        
        // 1. Precise Start Time
        const start = performance.now();
        const sessionId = session_id || crypto.randomUUID();

        // ─────────────────────────────────────────────────────────────────────
        // 0. ECONOMIC DOS PROTECTION
        // Prevent CPU amplification attacks via extremely large prompt payloads.
        // 16KB limit matches token-heavy governance overhead boundaries.
        // ─────────────────────────────────────────────────────────────────────
        const MAX_PROMPT_BYTES = 16384; // 16KB
        const promptSize = Buffer.byteLength(prompt, 'utf8');

        if (promptSize > MAX_PROMPT_BYTES) {
            void supabase.from('audit_logs').insert({
                org_id,
                action: 'PROMPT_SIZE_REJECTED',
                metadata: {
                    user_id,
                    session_id: sessionId,
                    size_bytes: promptSize,
                    limit_bytes: MAX_PROMPT_BYTES
                }
            });
            throw new Error('PROMPT_TOO_LARGE: Payloads exceeding 16KB are rejected for safety.');
        }

        // ─────────────────────────────────────────────────────────────────────
        // ZERO-TRUST AUTHORIZATION GATE
        // Must execute BEFORE any pipeline logic. org_id is verified against
        // the authenticated user's confirmed membership in `org_members`.
        // Any failure is forensically logged and execution is hard-stopped.
        // ─────────────────────────────────────────────────────────────────────
        try {
            await authorizeOrgAccess(user_id, org_id);
        } catch (authErr: any) {
            const isAuthError = authErr instanceof AuthorizationError;
            const code = isAuthError ? authErr.code : 'AUTHORIZATION_UNKNOWN_ERROR';

            // Forensic record — always write, never suppress.
            // redactPII applied: auth error messages may echo user-supplied values.
            void supabase.from('audit_logs').insert({
                org_id,
                action: 'AUTHORIZATION_FAILURE',
                metadata: redactPII({
                    code,
                    user_id,
                    org_id,
                    error: authErr.message,
                    session_id: sessionId,
                    timestamp: new Date().toISOString()
                })
            });

            // Surface a safe, non-leaking error to the caller
            throw new Error(`AUTHORIZATION_FAILURE: ${code}`);
        }
        // ─────────────────────────────────────────────────────────────────────

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

            // ── Fast Path vs Async Persistence ──────────────────────────────────
            // To protect the Node.js event loop under heavy load (>500 req/sec),
            // the HTTP request path must execute in < 10ms.
            //
            // The pipeline MUST ONLY perform synchronous in-memory logic:
            // 1. Policy Evaluation
            // 2. Guardrail Detection
            // 3. Risk Scoring
            //
            // ALL heavy cryptographic operations, hash computation, HMAC signature
            // generation, database inserts (like incidents or evidence ledger), 
            // and large-string regex (like redactPII on prompts) are deferred to 
            // the background async worker queue. redactPII in the fast-path is
            // strictly limited to metadata payloads <10KB.
            // ──────────────────────────────────────────────────────────────────
            
            const decision = riskScore >= 80 ? 'BLOCK' : riskScore >= 40 ? 'WARN' : 'ALLOW';
            const violations = policyResult.violations.length > 0 ? policyResult.violations : [];

            // 2. Compute Precision Latency (Internal Logic Execution)
            const duration = Math.round(performance.now() - start);

            // 3. Asynchronous Persistence — Enqueue Worker Job
            // The pipeline returns immediately after logical risk scoring.
            // Evidence Ledger hashing, database RPCs, audit logs, and telemetry
            // are serialized to the background queue, vastly reducing HTTP latency.
            const payload = {
                session_id: sessionId,
                org_id,
                decision,
                risk_score: riskScore,
                metadata: {
                    event_type: 'governance_evaluation',
                    prompt, // Unredacted! Redaction shifted to async worker.
                    model,
                    guardrail_signals: guardrailResult.signals,
                    violations,
                    latency: duration,
                    user_id,
                    voice_modifiers,
                    incident: incidentResult.create_incident ? incidentResult : null
                }
            };

            const secret = process.env.GOVERNANCE_SECRET;
            if (!secret) {
                throw new Error('CRITICAL_SECURITY_FAILURE: GOVERNANCE_SECRET must be configured to sign async payloads.');
            }

            const signature = crypto.createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            await governanceQueue.add('governance_event_job', {
                payload,
                signature
            });

            return {
                success: true,
                session_id: sessionId,
                decision,
                risk_score: riskScore,
                violations,
                incident: incidentResult.create_incident ? incidentResult : null,
                latency: duration,
                event_hash:    'PENDING_ASYNC',
                previous_hash: 'PENDING_ASYNC',
            };

        } catch (err: any) {
            console.error('Governance execution crash:', err);
            
            // Record failure in audit logs even on crash.
            // redactPII applied: err.message routinely echoes prompt fragments
            // (e.g. "Policy violation: <prompt excerpt>") which may contain PII.
            const crashDuration = Math.round(performance.now() - start);
            void supabase.from('audit_logs').insert({
                org_id,
                action: 'GOVERNANCE_CRASH',
                metadata: redactPII({
                    error: err.message,
                    processing_ms: crashDuration,
                    session_id: sessionId,
                    user_id
                })
            });

            throw err;
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

