import { NextRequest, NextResponse } from 'next/server';
import { AiInterceptorKernel } from '@/lib/gateway/aiInterceptorKernel';
import { logger } from '@/lib/logger';

/**
 * AI Gateway Interception API
 * 
 * Central gateway for pre-inference and post-inference governance.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, content, type } = body;

    if (!orgId || !content || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'prompt':
        result = await AiInterceptorKernel.interceptPrompt(orgId, content);
        break;
      case 'response':
        result = await AiInterceptorKernel.interceptResponse(orgId, content);
        break;
      case 'action':
        result = await AiInterceptorKernel.interceptAction(orgId, content);
        break;
      default:
        return NextResponse.json({ error: 'Invalid interception type' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    logger.error('INTERCEPTION_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
