import { NextResponse } from 'next/server';
import { AgentController } from '@/lib/agents/agentController';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

/**
 * POST /api/agents/control
 * Manually intervene in a running AI Agent session.
 */
export const POST = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { session_id, action } = await req.json();

    if (!session_id || !action) {
      return NextResponse.json({ error: 'Missing session_id or action' }, { status: 400 });
    }

    const session = await AgentController.controlSession(session_id, action);
    return NextResponse.json(session);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
