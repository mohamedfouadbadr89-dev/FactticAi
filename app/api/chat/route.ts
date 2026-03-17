import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governancePipeline';
import { EvidenceLedger } from '@/lib/evidence/evidenceLedger';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';
import { FraudDetectionEngine } from '@/lib/security/fraudDetectionEngine';
import { GovernanceAlertEngine } from '@/lib/governance/alertEngine';
import crypto from 'crypto';

/**
 * LLM Execution Layer
 *
 * Called after GovernancePipeline returns ALLOW.
 * Reads org's active connection for provider + model preference,
 * then calls the real LLM using env-level API keys.
 *
 * BYOK design note: keys are stored hashed (non-reversible) in ai_connections.
 * Plaintext keys come from server env vars (OPENAI_API_KEY / ANTHROPIC_API_KEY).
 * The connection record determines WHICH provider to call.
 */
async function executeLLM(orgId: string, prompt: string): Promise<string | null> {
  // Load org's active provider preference
  const { data: connection } = await supabaseServer
    .from('ai_connections')
    .select('provider, model')
    .eq('org_id', orgId)
    .eq('status', 'connected')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const provider = connection?.provider || 'openai';
  const model = connection?.model || 'gpt-4o-mini';

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  }

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  return null; // No LLM key configured — governance-only mode
}

/**
 * POST /api/chat
 * Auth: Supabase session cookie via withAuth() — orgId resolved automatically
 * Body: { prompt, model?, session_id? }
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  const t0 = Date.now();

  try {
    const body = await req.json();
    const { prompt, model, session_id } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const sessionId = session_id ?? crypto.randomUUID();

    // 0. Fraud Detection (2s timeout — unprotected DB call must not block the route)
    const fraudResult = await Promise.race([
      FraudDetectionEngine.evaluate({ session_id: sessionId, org_id: orgId, prompt }),
      new Promise<{ action: string; fraud_score: number; classification: string }>(
        (resolve) => setTimeout(() => resolve({ action: 'allow', fraud_score: 0, classification: 'normal' }), 2000)
      ),
    ]);

    if (fraudResult.action === 'block API key') {
      logger.warn('FRAUD_BLOCK', { org_id: orgId, session_id: sessionId, fraud_score: fraudResult.fraud_score });
      return NextResponse.json({
        error: 'Fraudulent activity detected. Access has been blocked.',
        fraud_score: fraudResult.fraud_score
      }, { status: 403 });
    } else if (fraudResult.action === 'throttle') {
      logger.warn('FRAUD_THROTTLE', { org_id: orgId, session_id: sessionId, fraud_score: fraudResult.fraud_score });
      return NextResponse.json({
        error: 'Too many suspicious requests. Please try again later.',
        fraud_score: fraudResult.fraud_score
      }, { status: 429 });
    }

    // 1. Governance Pipeline
    const result = await GovernancePipeline.execute({
      org_id: orgId,
      session_id: sessionId,
      prompt,
    });

    const latency = Date.now() - t0;

    // 2. Evidence Ledger + Session Persistence (fire-and-forget — do not block response)
    const persistAsync = async () => {
      try {
        await EvidenceLedger.write({
          session_id: sessionId,
          org_id: orgId,
          event_type: 'chat_governance',
          prompt,
          model: model || 'unspecified',
          decision: result.decision,
          risk_score: result.risk_score,
          violations: result.violations,
          guardrail_signals: result.signals,
          latency,
        });
      } catch (err: any) {
        logger.error('CHAT_EVIDENCE_LEDGER_FAILURE', { org_id: orgId, error: err.message });
      }

      GovernanceAlertEngine.evaluate({
        org_id: orgId,
        session_id: sessionId,
        risk_score: result.risk_score,
        policy_action: result.decision === 'BLOCK' ? 'block' : undefined,
        metadata: { violations: result.violations },
      });

      try {
        // total_risk and risk_score columns store 0.0–1.0 decimals, not 0–100
        const riskDecimal = Math.min(1, result.risk_score / 100);
        await supabaseServer.from('sessions').upsert({
          id: sessionId,
          org_id: orgId,
          status: result.decision === 'BLOCK' ? 'completed' : 'active',
          total_risk: riskDecimal,
          risk_score: riskDecimal,
          ended_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        await supabaseServer.from('session_turns').insert({
          session_id: sessionId,
          org_id: orgId,
          turn_index: 0,
          prompt,
          decision: result.decision,
          incremental_risk: result.risk_score,
          created_at: new Date().toISOString()
        });
      } catch (sessionErr: any) {
        logger.error('CHAT_SESSION_PERSISTENCE_FAILURE', { org_id: orgId, error: sessionErr.message });
      }
    };
    // Non-blocking: start persistence in background, don't await
    persistAsync().catch(e => logger.error('CHAT_PERSIST_UNHANDLED', { error: e.message }));

    // 2.5 Incident Ledger (fire-and-forget)
    if (result.decision !== 'ALLOW' || result.risk_score > 0) {
      const severity = result.risk_score >= 90 ? 'critical' : result.risk_score >= 70 ? 'high' : result.risk_score >= 40 ? 'medium' : 'low';
      const violation_type = result.violations?.[0]?.policy_name || (result.violations?.[0] as any)?.rule_type || 'unclassified';
      supabaseServer.from('incidents').insert({
        session_id: sessionId,
        org_id: orgId,
        severity,
        violation_type,
        timestamp: new Date().toISOString()
      }).then(({ error }) => {
        if (error) logger.error('CHAT_INCIDENT_PERSISTENCE_FAILURE', { org_id: orgId, error: error.message });
      });
    }

    // 3. Realtime broadcast → Live Monitor (fire-and-forget)
    fetch(
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
              topic: `governance:${orgId}`,
              event: "governance_event",
              payload: {
                event: "governance_event",
                data: {
                  session_id: sessionId,
                  org_id: orgId,
                  decision: result.decision,
                  risk_score: result.risk_score,
                  timestamp: new Date().toISOString()
                }
              }
            }]
          })
        }
    ).catch((telemetryErr: any) => {
      logger.error('TELEMETRY_FAILED', { error: telemetryErr.message });
    });

    // 4. LLM Execution — only if governance allows it
    let llmResponse: string | null = null;
    let llmLatency: number | null = null;
    if (result.decision === 'ALLOW') {
      const llmT0 = Date.now();
      try {
        // 10-second timeout on LLM call to prevent indefinite hang
        llmResponse = await Promise.race([
          executeLLM(orgId, prompt),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
        ]);
        llmLatency = Date.now() - llmT0;
      } catch (llmErr: any) {
        logger.warn('LLM_EXECUTION_SKIPPED', { orgId, error: llmErr.message });
      }
    }

    return NextResponse.json({
      status: 'ok',
      session_id: sessionId,
      decision: result.decision,
      risk_score: result.risk_score,
      behavior: result.behavior,
      violations: result.violations,
      response: llmResponse,
      metadata: {
        latency_ms: latency,
        llm_latency_ms: llmLatency,
        governance_only: llmResponse === null,
      },
    }, { status: 200 });

  } catch (err: any) {
    logger.error('CHAT_API_FAILURE', { error: err.message });
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
});
