import { NextResponse } from 'next/server';
import { ChatConversation } from '@/models/ChatConversation';
import { saveChatConversation } from '@/database/chatConversations';
import { analyzeChatConversation } from '@/analysis/chatRiskAnalysis';
import { logger } from '@/lib/logger';

/**
 * Validates the webhook signature or secret token
 */
function verifyAuthenticity(req: Request): boolean {
  // Shared secret check via Authorization Bearer token
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split('Bearer ')?.[1];
  const expectedToken = process.env.CHAT_WEBHOOK_SECRET;

  if (expectedToken && token === expectedToken) {
    return true;
  }

  const secretHeader = req.headers.get('x-webhook-secret');
  if (expectedToken && secretHeader === expectedToken) {
    return true;
  }

  if (!expectedToken) {
    console.warn('CHAT_WEBHOOK_SECRET is not configured in the environment.');
    return false;
  }

  return false;
}

/**
 * Normalizes different chat provider payloads (OpenAI, Anthropic) into a ChatConversation
 */
export function normalizeChatPayload(payload: any, orgId: string): ChatConversation {
  // OpenAI structure detection (typical Chat Completion response)
  if (payload.model && payload.choices && Array.isArray(payload.choices) && payload.id) {
    const transcript = payload.choices.map((c: any) => c.message?.content).join('\n');
    return new ChatConversation({
      orgId,
      provider: 'openai',
      externalId: payload.id,
      startTime: payload.created ? new Date(payload.created * 1000) : new Date(),
      transcript: transcript || undefined,
      metadata: payload
    });
  }

  // Anthropic structure detection (typical Message response)
  if (payload.type === 'message' && payload.model && payload.id) {
    const transcript = payload.content?.map((c: any) => c.text).join('\n');
    return new ChatConversation({
      orgId,
      provider: 'anthropic',
      externalId: payload.id,
      startTime: new Date(), // Anthropic doesn't typically send explicit unparsed timestamps in the response body outside usage blocks 
      transcript: transcript || undefined,
      metadata: payload
    });
  }

  // Generic/Custom structure fallback
  const chatId = payload.id || payload.session_id || payload.chat_id;
  
  if (!chatId) {
    throw new Error('Unsupported payload format: missing chat identifier');
  }

  return new ChatConversation({
    orgId,
    provider: payload.provider || 'unknown',
    externalId: String(chatId),
    startTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    transcript: payload.text || payload.transcript || undefined,
    metadata: payload
  });
}

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    if (!verifyAuthenticity(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract tenant and BYOK security configuration
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || req.headers.get('x-org-id');
    const byokKey = req.headers.get('x-byok-key'); 

    if (!orgId) {
      return NextResponse.json({ error: 'Missing organization ID context (orgId)' }, { status: 400 });
    }

    if (!byokKey) {
       return NextResponse.json({ error: 'BYOK Enforcement: Missing x-byok-key header. Cannot process unencrypted payload requests.' }, { status: 403 });
    }

    // 3. Parse incoming JSON payload
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 4. Normalize the data
    let conversation: ChatConversation;
    try {
      conversation = normalizeChatPayload(payload, orgId);
    } catch (error: any) {
      return NextResponse.json({ error: `Validation failed: ${error.message}` }, { status: 422 });
    }

    // 5. Encrypt sensitive fields and save to `chat_conversations` table
    let insertId: string;
    try {
      insertId = await saveChatConversation(conversation, byokKey);
    } catch (dbError: any) {
      logger.error('Database error saving chat conversation:', dbError);
      return NextResponse.json({ error: 'Failed to securely store conversation data' }, { status: 500 });
    }

    // 6. Async Governance triggering pipeline
    analyzeChatConversation(insertId, orgId, byokKey).catch((err: any) => {
        logger.error('[Chat Webhook] Async risk analysis failed:', err);
    });

    return NextResponse.json({ success: true, id: insertId }, { status: 200 });

  } catch (error: any) {
    logger.error('Chat Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
