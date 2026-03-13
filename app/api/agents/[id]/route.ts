import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { resolveAgentContext } from '@/lib/agentResolver';

/**
 * API: /api/agents/[id]
 * Description: Retrieves a single agent, validated by organization ownership and active status.
 */
export const GET = withAuth(async (req: Request, { orgId, params }: AuthContext) => {
  try {
    const { id } = params;
    const agent = await resolveAgentContext(id, orgId);

    return NextResponse.json({ agent });

  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent' },
      { status }
    );
  }
});
