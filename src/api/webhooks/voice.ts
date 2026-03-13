import { NextResponse } from 'next/server';
import { VoiceConversation } from '../../models/VoiceConversation';
import { analyzeVoiceConversation } from '../../analysis/voiceRiskAnalysis';
import { normalizeConversationData } from '../../utils/conversationUtils';
import { saveVoiceConversation } from '../../database/voiceConversations';
import { logger } from '@/lib/logger';

/**
 * Validates the webhook signature or secret token
 */
function verifyAuthenticity(req: Request): boolean {
  // Shared secret check via Authorization Bearer token
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split('Bearer ')?.[1];
  const expectedToken = process.env.VOICE_WEBHOOK_SECRET;

  if (expectedToken && token === expectedToken) {
    return true;
  }

  // Alternatively check for a specific header like x-webhook-secret
  const secretHeader = req.headers.get('x-webhook-secret');
  if (expectedToken && secretHeader === expectedToken) {
    return true;
  }

  // If no expected token is configured, we reject by default to enforce security
  if (!expectedToken) {
    console.warn('VOICE_WEBHOOK_SECRET is not configured in the environment.');
    return false;
  }

  return false;
}



export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    if (!verifyAuthenticity(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Extract tenant and BYOK security configuration
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || req.headers.get('x-org-id');
    const byokKey = req.headers.get('x-byok-key');
    
    if (!orgId) {
      return NextResponse.json({ error: 'Missing organization ID context (orgId)' }, { status: 400 });
    }

    if (!byokKey) {
       return NextResponse.json({ error: 'BYOK Enforcement: Missing x-byok-key header. Cannot process unencrypted voice payload requests.' }, { status: 403 });
    }

    // 4. Parse incoming JSON payload
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 5. Normalize the data
    let conversation: VoiceConversation;
    try {
      conversation = normalizeConversationData(payload, orgId);
    } catch (error: any) {
      return NextResponse.json({ error: `Validation failed: ${error.message}` }, { status: 422 });
    }

    // 6. Save to `voice_conversations` table securely encrypting sensitive values
    let insertId: string;
    try {
       insertId = await saveVoiceConversation(conversation, byokKey);
    } catch (err: any) {
       logger.error('Database error saving voice conversation:', err);
       return NextResponse.json({ error: 'Failed to securely store conversation data' }, { status: 500 });
    }

    // Trigger Facttic Risk Analysis Engine asynchronously
    // We don't await this to ensure the webhook responds quickly
    analyzeVoiceConversation(conversation).catch((err: any) => {
      logger.error('[Webhook] Async risk analysis failed:', err);
    });

    // 5. Return success response
    return NextResponse.json({ success: true, id: insertId }, { status: 200 });

  } catch (error: any) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
