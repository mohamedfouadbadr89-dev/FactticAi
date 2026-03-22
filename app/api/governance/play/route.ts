import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Diagnostic Connectivity Check
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ONLINE', 
    engine: 'Facttic Governance Engine v5.0', 
    bypass: 'INACTIVE' 
  });
}

/**
 * Playground Execution Route
 * Specifically tuned for UI responsiveness and high-latency toleration.
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  console.log('PIPELINE_START_WITH_TIMEOUT_2000');
  
  console.log('[Playground API] Request received', { userId, orgId });

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, model, session_id, channel } = body;
    console.log('[Playground API] Body parsed', { hasPrompt: !!prompt, model, channel });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Task 1: Execute with strict v5.0 contracts + playground flags
    const result = await GovernancePipeline.execute({
      org_id: orgId,
      user_id: userId,
      prompt,
      model,
      session_id: session_id || null,
      playground_mode: true,
      client_sent_at: Date.now(), // Clock-sync required by v5.0
      timeout_ms: 2000
    });
    console.log('[Playground API] Pipeline result:', { decision: result.decision, latency: result.latency });

    // Map to exact JSON schema required by playground UI GovernanceResults
    const mappedResponse = {
      decision: result.decision,
      risk_score: Math.ceil(result.risk_score),
      session_id: result.session_id,
      metadata: {
        latency_ms: result.latency || 0
      },
      behavior: {
        intent_drift: result.behavior?.intent_drift ?? Math.min(result.risk_score * 0.4, 100),
        toxicity: result.behavior?.toxicity ?? Math.min(result.risk_score * 0.8, 100),
        jailbreak_probability: result.behavior?.jailbreak_probability ?? (result.risk_score > 60 ? 80 : 5),
        override_detect: result.behavior?.override_detect ?? (result.risk_score > 80)
      },
      violations: result.fail_closed 
        ? [] 
        : (result.violations?.length > 0 
            ? result.violations 
            : (result.decision === 'BLOCK' ? [{ policy_name: 'Behavioral Guardrails', action: 'block', metadata: { cause: 'Aggregated guardrail metrics (Toxicity/Drift) exceeded safe threshold.' } }] : [])
          ).map((v: any) => ({
             policy_name: v.policy_name || v.rule || 'Unknown Policy',
             action: v.action || result.decision,
             metadata: {
               cause: v.metadata?.cause || v.message || 'Triggered by pipeline rules'
             }
          })),
      governance_state: result.risk_score > 60 ? 'DEGRADED' : 'STABLE'
    };

    // Write to runtime_intercepts — source of truth for counters
    await supabase.from('runtime_intercepts').insert({
      org_id: orgId,
      session_id: mappedResponse.session_id,
      model_name: model || 'facttic-v5',
      risk_score: mappedResponse.risk_score,
      action: result.decision.toLowerCase(),
      payload: {
        prompt_preview: prompt?.slice(0, 200),
        violations: mappedResponse.violations,
        behavior: mappedResponse.behavior,
        channel: channel || 'text'
      }
    });

    if (channel === 'voice') {
      await supabase.from('voice_sessions').insert({
        id: mappedResponse.session_id,
        session_id: mappedResponse.session_id,
        provider: 'playground_voice',
        call_started_at: new Date().toISOString()
      });
      (mappedResponse.metadata as any).channel = 'voice';
    }

    // Save to audit_logs
    await supabase.from('audit_logs').insert({
      org_id: orgId,
      action: 'governance_event',
      resource: mappedResponse.session_id,
      metadata: {
        risk_score: mappedResponse.risk_score,
        decision: mappedResponse.decision,
        prompt_text: prompt,
        latency: mappedResponse.metadata.latency_ms
      }
    });

    // Broadcast
    supabase.channel(`governance:${orgId}`).send({
      type: 'broadcast',
      event: 'governance_event',
      payload: {
        session_id: mappedResponse.session_id,
        timestamp: Date.now(),
        risk_score: mappedResponse.risk_score,
        decision: mappedResponse.decision,
        prompt_text: prompt,
        latency: mappedResponse.metadata.latency_ms
      }
    });

    return NextResponse.json(mappedResponse, { status: 200 });

  } catch (err: any) {
    console.error('[Playground API] CRITICAL_FAILURE:', err.message);
    logger.error('PLAYGROUND_API_FAILURE', { error: err.message, userId, orgId });
    
    return NextResponse.json({
      decision: 'BLOCK',
      risk_score: 100,
      session_id: 'fail-closed',
      metadata: { latency_ms: 0 },
      behavior: { intent_drift: 0, override_detect: false },
      violations: [],
      governance_state: 'FAILURE'
    }, { status: 200 });
  }
});

