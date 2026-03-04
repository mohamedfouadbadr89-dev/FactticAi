import { NextResponse } from 'next/server';
import { AgentController } from '@/lib/agents/agentController';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/agents/start
 * Initialize a new managed AI Agent session.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { agent_name, session_id } = await req.json();

    if (!agent_name || !session_id) {
      return NextResponse.json({ error: 'Missing agent_name or session_id' }, { status: 400 });
    }

    const session = await AgentController.startSession(context.orgId, agent_name, session_id);
    return NextResponse.json(session);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
