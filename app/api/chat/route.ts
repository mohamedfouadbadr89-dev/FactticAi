import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { AiGateway } from '@/lib/gateway/aiGateway';
import { logger } from '@/lib/logger';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/chat
 * REAL LLM → GOVERNED → LOGGED → SAFE RESPONSE SYSTEM
 * 
 * NEW FLOW:
 * 1. Prompt received
 * 2. GovernancePipeline → evaluate(prompt)
 * IF BLOCK → return result
 * IF ALLOW →
 * 3. Call AiGateway → get model_output (governed internally)
 * 4. Run GovernancePipeline AGAIN for RESPONSE validation
 * 5. Final decision: IF hazardous → BLOCK, ELSE → return response
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  const start = Date.now();
  let latestResult: any = null;
  let session_id: string | undefined;

  try {
    const body = await req.json();
    const { prompt, model, session_id: existing_session_id } = body;
    session_id = existing_session_id;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // ── STEP 1: PROMPT GOVERNANCE ─────────────────────────────────────────────
    const promptResult = await GovernancePipeline.execute({
      org_id: orgId,
      user_id: userId,
      session_id: session_id || null,
      prompt,
      model
    });
    
    latestResult = promptResult;
    session_id = promptResult.session_id;

    if (promptResult.decision === 'BLOCK') {
      logger.info('CHAT_BLOCKED_PROMPT', { orgId, session_id });
      return NextResponse.json(promptResult, { status: 200 });
    }

    // ── STEP 2: LLM EXECUTION (via Governed AI Gateway) ───────────────────────
    let gatewayResponse;
    try {
      gatewayResponse = await AiGateway.route(orgId, {
        prompt,
        model: model || 'gpt-4o-mini',
        session_id: session_id
      });
    } catch (llmErr: any) {
      logger.error('GATEWAY_EXECUTION_FAILED', { orgId, error: llmErr.message });
      
      // FAIL CLOSED: If LLM fails, return the prompt result but with BLOCK state
      return NextResponse.json({
        ...promptResult,
        decision: 'BLOCK',
        risk_score: 100,
        violations: [...promptResult.violations, { policy_name: 'System Failure', rule_type: 'provider_error' }],
        error: llmErr.message
      }, { status: 200 });
    }

    // ── STEP 3: RESPONSE GOVERNANCE ───────────────────────────────────────────
    // Mandatory re-evaluation of the pipeline with the actual content
    const finalResult = await GovernancePipeline.execute({
      org_id: orgId,
      user_id: userId,
      session_id: session_id || null,
      prompt,
      response: gatewayResponse.response,
      model: `${gatewayResponse.provider}/${gatewayResponse.model}`
    });

    latestResult = finalResult;

    // ── STEP 4: FINAL DECISION ────────────────────────────────────────────────
    if (finalResult.decision === 'BLOCK') {
      logger.warn('CHAT_BLOCKED_RESPONSE', { orgId, session_id });
      return NextResponse.json({
        ...finalResult,
        response: "[REDACTED: Response blocked by governance policy]"
      }, { status: 200 });
    }

    return NextResponse.json({
      ...finalResult,
      response: gatewayResponse.response,
      metadata: {
        provider: gatewayResponse.provider,
        model: gatewayResponse.model,
        latency_ms: Date.now() - start
      },
    }, { status: 200 });

  } catch (err: any) {
    logger.error('CHAT_API_CRITICAL_FAILURE', { error: err.message, userId, orgId });
    
    // FAIL CLOSED on any system error
    return NextResponse.json(
      { 
        success: false,
        session_id: session_id || 'unknown',
        decision: 'BLOCK',
        risk_score: 100,
        error: 'Governance execution failure', 
        message: 'The request could not be processed due to a security subsystem error.' 
      },
      { status: 500 }
    );
  }
});

