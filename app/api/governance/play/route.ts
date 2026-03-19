import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { logger } from '@/lib/logger';

/**
 * Playground Execution Route
 * Specifically tuned for UI responsiveness and high-latency toleration.
 */
export const POST = withAuth(async (req: Request, { orgId, userId }: AuthContext) => {
  try {
    const body = await req.json();
    const { prompt, model, session_id } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Task 1: Execute with strict v5.0 contracts + playground flags
    const result = await GovernancePipeline.execute({
      org_id: orgId,
      user_id: userId,
      prompt,
      model,
      session_id: session_id || undefined,
      playground_mode: true,
      client_sent_at: Date.now() // Clock-sync required by v5.0
    });

    // Task 1: Map results (including BLOCK/Fail-Closed) to 200 so UI clears "Analyzing"
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    logger.error('PLAYGROUND_API_FAILURE', { error: err.message, userId, orgId });
    
    // Fail-Closed mapping via catch block
    return NextResponse.json({
      success: false,
      decision: 'BLOCK',
      risk_score: 100,
      violations: [{ 
        policy_name: 'Pipeline Crash Recovery', 
        rule_type: 'system_error', 
        action: 'block' 
      }],
      error: 'Governance Engine experienced an internal failure.',
      message: err.message,
      latency: 0
    }, { status: 200 });
  }
});
