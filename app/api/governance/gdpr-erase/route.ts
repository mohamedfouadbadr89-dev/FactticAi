import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from 'next/server';
import { GdprEraseEngine } from '@/lib/governance/gdprEraseEngine';
import { logger } from '@/lib/logger';

/**
 * GDPR Session Erasure API
 * 
 * CORE PRINCIPLE: Right-to-Erasure. Purge all data linked to a specific session ID.
 */
export async function POST(req: NextRequest) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Trigger Erasure using org_id from the verified API key
    const result = await GdprEraseEngine.eraseSession(verifiedOrgId, session_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Session erasure initiated and completed successfully.',
      session_id 
    }, { status: 200 });

  } catch (error: any) {
    logger.error('GDPR_API_CRITICAL_FAILURE', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
