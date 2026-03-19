import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * LLM Execution Layer
 * Called only after GovernancePipeline returns ALLOW.
 */
async function executeLLM(orgId: string, prompt: string): Promise<string | null> {
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

  return null;
}

/**
 * POST /api/chat
 * Delegates all logic to GovernancePipeline (lib/governance/governancePipeline.ts)
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const body = await req.json();
    const { prompt, model, session_id } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // 1. Governance Pipeline Execution (The Single Source of Truth)
    // Handles Authorization, Fraud, Policy evaluation, Persistence, and Realtime broadcast.
    const result = await GovernancePipeline.execute({
      org_id: orgId,
      user_id: userId,
      session_id,
      prompt,
      model
    });

    // 2. LLM Execution (Conditional on Pipeline Decision)
    let llmResponse: string | null = null;
    if (result.decision === 'ALLOW') {
      try {
        // LLM Execution is limited to a 10s timeout
        llmResponse = await Promise.race([
          executeLLM(orgId, prompt),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
        ]);
        
        // Optional: Run GovernancePipeline again for RESPONSE validation
        if (llmResponse) {
           await GovernancePipeline.execute({
             org_id: orgId,
             user_id: userId,
             session_id: result.session_id,
             prompt,
             response: llmResponse,
             model
           });
        }
      } catch (llmErr: any) {
        logger.warn('LLM_EXECUTION_FAILED', { orgId, error: llmErr.message });
      }
    }

    return NextResponse.json({
      ...result,
      response: llmResponse,
      metadata: {
        governance_only: llmResponse === null,
      },
    }, { status: 200 });

  } catch (err: any) {
    logger.error('CHAT_API_CRITICAL_FAILURE', { error: err.message, userId, orgId });
    return NextResponse.json(
      { error: 'Governance execution failure', message: 'The request could not be processed due to a security subsystem error.' },
      { status: 500 }
    );
  }
});
