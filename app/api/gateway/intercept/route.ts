import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { AiInterceptorKernel } from '@/lib/gateway/aiInterceptorKernel';
import { logger } from '@/lib/logger';

/**
  * AI Gateway Interception API
  * 
  * Central gateway for pre-inference and post-inference governance.
  */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { content, type } = body;

    if (!content || !type) {
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
    logger.error('INTERCEPTION_API_FAILURE', { error: err.message, orgId });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});

