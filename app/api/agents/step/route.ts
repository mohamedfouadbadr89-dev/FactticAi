import { NextResponse } from 'next/server';
import { AgentController } from '@/lib/agents/agentController';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/agents/step
 * Log an agent execution step (reasoning, tool call, etc.) and receive governance feedback.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const body = await req.json();
    const { session_id, action_type, tool_name, model_name, observation, risk_score, seed } = body;

    if (seed === true) {
      const result = await AgentController.seedDemoAgents(context.orgId);
      return NextResponse.json({ message: 'Seeded demo agent session', ...result });
    }

    if (!session_id || !action_type) {
      return NextResponse.json({ error: 'Missing session_id or action_type' }, { status: 400 });
    }

    const result = await AgentController.processStep({
      session_id,
      action_type,
      tool_name,
      model_name,
      observation,
      risk_score
    });

    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
