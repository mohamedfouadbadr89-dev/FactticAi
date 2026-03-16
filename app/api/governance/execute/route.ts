import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { resolveOrgContext } from '@/lib/orgResolver';
import { logger } from '@/lib/logger';
import { EvidenceLedger } from '@/lib/evidence/evidenceLedger';
import { mirrorGovernanceToSession } from '@/lib/bridges/governanceSessionBridge';
import { supabaseServer } from '@/lib/supabaseServer';
import { FraudDetectionEngine } from '@/lib/security/fraudDetectionEngine';
import { GovernanceAlertEngine } from '@/lib/governance/alertEngine';
import crypto from 'crypto';

/**
 * Control API Layer (v1.0)
 * Central entry point for all governance evaluations.
 */
export async function POST(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // org_id and user_id from verified API key — never trusted from payload
  const verifiedOrgId = authResult.org_id;
  const verifiedUserId = authResult.user_id ?? 'api-key-principal';

  const t0 = Date.now();
  let orgId = '';

  try {
    const body = await req.json();
    const { org_id, prompt, model, metadata, simulation_mode, playground_mode } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    orgId = org_id;

    const sessionId = metadata?.session_id ?? crypto.randomUUID();

    // 0 — Fraud Detection
    const fraudResult = await FraudDetectionEngine.evaluate({
      session_id: sessionId,
      org_id,
      prompt,
      risk_score: metadata?.risk_score,
      violations: metadata?.violations
    });

    if (fraudResult.action === 'block API key') {
      logger.warn('FRAUD_BLOCK_API', { org_id, session_id: sessionId, fraud_score: fraudResult.fraud_score });
      return NextResponse.json({
        error: 'Fraudulent activity detected. API key has been disabled.',
        fraud_score: fraudResult.fraud_score
      }, { status: 403 });
    } else if (fraudResult.action === 'throttle') {
      logger.warn('FRAUD_THROTTLE_API', { org_id, session_id: sessionId, fraud_score: fraudResult.fraud_score });
      return NextResponse.json({
        error: 'Too many suspicious requests. Please try again later.',
        fraud_score: fraudResult.fraud_score
      }, { status: 429 });
    }

    /**
     * 1 — Execute Governance Pipeline
     */
    const result = await GovernancePipeline.execute({
      org_id: verifiedOrgId,
      user_id: verifiedUserId,
      prompt,
      session_id: sessionId
    }) as any;

    let modelResponse: string | null = null;
    let ledgerEntry = null;

    /**
     * ======================================================
     * BLOCK FLOW
     * ======================================================
     */
    if (result.decision === "BLOCK") {

      try {

        /**
         * Evidence Ledger — canonical forensic record (facttic_governance_events)
         */
        ledgerEntry = await EvidenceLedger.write({
          session_id: sessionId,
          org_id,
          event_type: 'governance_execution',
          prompt: prompt || null,
          model: model || 'unspecified',
          decision: result.decision,
          risk_score: result.risk_score,
          violations: result.violations,
          guardrail_signals: (result as any).guardrail_signals || result.signals,
          latency: Date.now() - t0,
        });

        /**
         * Alert Engine — fire-and-forget threshold evaluation
         */
        GovernanceAlertEngine.evaluate({
          org_id,
          session_id: sessionId,
          risk_score: result.risk_score,
          policy_action: 'block',
          metadata: { violations: result.violations },
        });

        try {
          await supabaseServer
            .from('sessions')
            .upsert({
              id: sessionId,
              org_id,
              status: 'blocked',
              total_risk: result.risk_score,
              ended_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            });
            
          await supabaseServer
            .from('session_turns')
            .insert({
              session_id: sessionId,
              org_id,
              turn_index: 0,
              prompt,
              decision: result.decision,
              incremental_risk: result.risk_score,
              created_at: new Date().toISOString()
            });
        } catch (sessionErr: any) {
          logger.error('SESSION_PERSISTENCE_FAILURE', { org_id, error: sessionErr.message });
        }

        /**
         * Mirror into session system
         */
        await mirrorGovernanceToSession({
          session_id: sessionId,
          org_id,
          prompt: prompt || null,
          decision: result.decision,
          risk_score: result.risk_score,
          violations: result.violations,
        });

        /**
         * Realtime Broadcast (Live Monitor)
         */
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [{
                topic: `realtime:governance:${org_id}`,
                event: 'broadcast',
                payload: {
                  type: 'broadcast',
                  event: 'governance_event',
                  payload: {
                    session_id: sessionId,
                    org_id,
                    decision: result.decision,
                    risk_score: result.risk_score,
                    timestamp: new Date().toISOString()
                  }
                },
              }],
            }),
          });
        } catch (telemetryErr: any) {
          logger.error('TELEMETRY_FAILED', { error: telemetryErr.message });
        }

      } catch (err: any) {
        logger.error('LEDGER_PERSISTENCE_FAILURE', { org_id, error: err.message });
      }

      return NextResponse.json({
        status: "ok",
        session_id: sessionId,
        decision: result.decision,
        risk_score: result.risk_score,
        violations: result.violations,
        guardrails: result.signals?.guardrail || {},
        alerts: result.violations.length > 0 ? "High Risk Detected" : "Normal",
        ledger_id: ledgerEntry?.event_id || null,
        metadata: {
          latency_ms: Date.now() - t0,
          simulation_mode: !!simulation_mode,
          playground_mode: !!playground_mode
        }
      });
    }

    /**
     * ======================================================
     * ALLOW / WARN FLOW
     * ======================================================
     */

    const aiProvider = {
      generate: async (_p: string) => {
        return metadata?.response || `[Simulated Generation] Safely evaluated prompt and proceeded.`;
      }
    };

    modelResponse = await aiProvider.generate(prompt);

    try {

      ledgerEntry = await EvidenceLedger.write({
        session_id: sessionId,
        org_id,
        event_type: 'governance_execution',
        prompt: prompt || null,
        model: model || 'unspecified',
        decision: result.decision,
        risk_score: result.risk_score,
        violations: result.violations,
        guardrail_signals: (result as any).guardrail_signals || result.signals,
        latency: Date.now() - t0,
        model_response: modelResponse
      });

      GovernanceAlertEngine.evaluate({
        org_id,
        session_id: sessionId,
        risk_score: result.risk_score,
        policy_action: result.decision === 'BLOCK' ? 'block' : undefined,
        metadata: { violations: result.violations },
      });

      try {
        await supabaseServer
          .from('sessions')
          .upsert({
            id: sessionId,
            org_id,
            status: 'completed',
            total_risk: result.risk_score,
            ended_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
          
        await supabaseServer
          .from('session_turns')
          .insert({
            session_id: sessionId,
            org_id,
            turn_index: 0,
            prompt,
            decision: result.decision,
            incremental_risk: result.risk_score,
            created_at: new Date().toISOString()
          });
      } catch (sessionErr: any) {
        logger.error('SESSION_PERSISTENCE_FAILURE', { org_id, error: sessionErr.message });
      }

      await mirrorGovernanceToSession({
        session_id: sessionId,
        org_id,
        prompt: prompt || null,
        decision: result.decision,
        risk_score: result.risk_score,
        violations: result.violations,
      });

      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{
              topic: `realtime:governance:${org_id}`,
              event: 'broadcast',
              payload: {
                type: 'broadcast',
                event: 'governance_event',
                payload: {
                  session_id: sessionId,
                  org_id,
                  decision: result.decision,
                  risk_score: result.risk_score,
                  timestamp: new Date().toISOString()
                }
              },
            }],
          }),
        });
      } catch (telemetryErr: any) {
        logger.error('TELEMETRY_FAILED', { error: telemetryErr.message });
      }

    } catch (err: any) {
      logger.error('PERSISTENCE_FAILURE', { org_id, error: err.message });
    }

    return NextResponse.json({
      status: "ok",
      session_id: sessionId,
      decision: result.decision,
      risk_score: result.risk_score,
      violations: result.violations,
      guardrails: result.signals?.guardrail || {},
      alerts: result.violations.length > 0 ? "High Risk Detected" : "Normal",
      ledger_id: ledgerEntry?.event_id || null,
      model_response: modelResponse,
      metadata: {
        latency_ms: Date.now() - t0,
        simulation_mode: !!simulation_mode,
        playground_mode: !!playground_mode
      }
    });

  } catch (err: any) {
    logger.error('CONTROL_LAYER_API_FAILURE', { orgId, error: err.message });

    return NextResponse.json(
      { error: 'Internal Control Layer Failure', message: err.message },
      { status: 500 }
    );
  }
}