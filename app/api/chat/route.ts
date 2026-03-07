import { NextResponse } from 'next/server';
import { GovernancePipeline } from '@/lib/governancePipeline';
import { EvidenceLedger } from '@/lib/evidence/evidenceLedger';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';
import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { FraudDetectionEngine } from '@/lib/security/fraudDetectionEngine';
import { GovernanceAlertEngine } from '@/lib/governance/alertEngine';
import crypto from 'crypto';

/**
 * POST /api/chat
 *
 * Primary chat entry point. Evaluates the prompt through the governance
 * pipeline, persists the result to the evidence ledger, and broadcasts
 * to the Supabase realtime telemetry channel so the Live Monitor updates.
 *
 * Body: { org_id, prompt, model?, session_id? }
 */
export async function POST(req: Request) {
  const t0 = Date.now();

  try {
    const authResult = await verifyApiKey(req);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    // Override org_id from the verified API key
    const verifiedOrgId = authResult.org_id;

    const body = await req.json();
    const { org_id: bodyOrgId, prompt, model, session_id } = body;
    
    const org_id = verifiedOrgId || bodyOrgId;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const sessionId = session_id ?? crypto.randomUUID();

    // 0. Fraud Detection
    const fraudResult = await FraudDetectionEngine.evaluate({
      session_id: sessionId,
      org_id,
      prompt,
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

    // 1. Governance Pipeline
    const result = await GovernancePipeline.execute({
      org_id,
      session_id: sessionId,
      prompt,
    });

    const latency = Date.now() - t0;

    // 2. Evidence Ledger — canonical forensic record (facttic_governance_events)
    try {
      await EvidenceLedger.write({
        session_id: sessionId,
        org_id,
        event_type: 'chat_governance',
        prompt,
        model: model || 'unspecified',
        decision: result.decision,
        risk_score: result.risk_score,
        violations: result.violations,
        guardrail_signals: result.signals,
        latency,
      });

      GovernanceAlertEngine.evaluate({
        org_id,
        session_id: sessionId,
        risk_score: result.risk_score,
        policy_action: result.decision === 'BLOCK' ? 'block' : undefined,
        metadata: { violations: result.violations },
      });
    } catch (err: any) {
      logger.error('CHAT_EVIDENCE_LEDGER_FAILURE', { org_id, error: err.message });
    }

    try {
      await supabaseServer
        .from('sessions')
        .upsert({
          id: sessionId,
          org_id,
          status: result.decision === 'BLOCK' ? 'blocked' : 'completed',
          total_risk: result.risk_score,
          decision: result.decision,
          risk_score: result.risk_score,
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
      logger.error('CHAT_SESSION_PERSISTENCE_FAILURE', { org_id, error: sessionErr.message });
    }

    // 2.5 Incident Ledger
    if (result.decision !== 'ALLOW' || result.risk_score > 0) {
      try {
        const severity = result.risk_score >= 90 ? 'critical' : result.risk_score >= 70 ? 'high' : result.risk_score >= 40 ? 'medium' : 'low';
        const violation_type = result.violations?.[0]?.policy_name || (result.violations?.[0] as any)?.rule_type || 'unclassified';
        await supabaseServer
          .from('incidents')
          .insert({
            session_id: sessionId,
            org_id,
            severity,
            violation_type,
            timestamp: new Date().toISOString()
          });
      } catch (incErr: any) {
        logger.error('CHAT_INCIDENT_PERSISTENCE_FAILURE', { org_id, error: incErr.message });
      }
    }

    // 3. Realtime broadcast → Live Monitor via REST (WebSocket not available server-side)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY!,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            messages: [{
              topic: `realtime:governance:${org_id}`,
              event: "broadcast",
              payload: {
                type: "broadcast",
                event: "governance_event",
                payload: {
                  session_id: sessionId,
                  org_id,
                  decision: result.decision,
                  risk_score: result.risk_score,
                  timestamp: new Date().toISOString()
                }
              }
            }]
          })
        }
      );
    } catch (telemetryErr: any) {
      logger.error('TELEMETRY_FAILED', { error: telemetryErr.message });
    }

    return NextResponse.json({
      status: 'ok',
      session_id: sessionId,
      decision: result.decision,
      risk_score: result.risk_score,
      behavior: result.behavior,
      violations: result.violations,
      metadata: { latency_ms: latency },
    }, { status: 200 });

  } catch (err: any) {
    logger.error('CHAT_API_FAILURE', { error: err.message });
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
