import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { GovernancePipeline } from '@/lib/governancePipeline';
import { logger } from '@/lib/logger';

/**
 * Unified Governance Evaluation API (v2.0)
 * 
 * Orchestrates multiple engines through the centralized GovernancePipeline.
 */
export async function POST(req: Request) {
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
    const body = await req.json();
    const { org_id, session_id, prompt, response } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Centralized Pipeline Execution
    const result = await GovernancePipeline.execute({
      org_id,
      session_id,
      prompt,
      response
    });

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    logger.error('UNIFIED_EVAL_API_FAILURE', { error: err.message });
    return NextResponse.json(
      { error: 'Internal Governance Failure', message: err.message }, 
      { status: 500 }
    );
  }
}