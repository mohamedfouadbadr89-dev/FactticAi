import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { resolveAgentContext } from '@/lib/agentResolver';

/**
 * API: /api/agents/[id]
 * Description: Retrieves a single agent, validated by organization ownership and active status.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withAuth(req);

    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { org_id } = await resolveOrgContext(auth.user.id);
    const { id } = await params;

    const agent = await resolveAgentContext(id, org_id);

    return NextResponse.json({ agent });

  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent' },
      { status }
    );
  }
}
