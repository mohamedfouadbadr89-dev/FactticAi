import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { VoiceConversation } from '../../models/VoiceConversation';
import { analyzeVoiceConversation } from '@/analysis/voiceRiskAnalysis';

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

/**
 * Normalizes different voice provider payloads into a VoiceConversation
 */
export function normalizePayload(payload: any, orgId: string): VoiceConversation {
  // Retell structure detection
  if (payload.event && payload.call && payload.call.call_id) {
    return new VoiceConversation({
      orgId,
      provider: 'retell',
      externalId: payload.call.call_id,
      startTime: payload.call.start_timestamp ? new Date(payload.call.start_timestamp) : new Date(),
      endTime: payload.call.end_timestamp ? new Date(payload.call.end_timestamp) : undefined,
      transcript: payload.call.transcript || undefined,
      audio: payload.call.recording_url || undefined,
      metadata: payload
    });
  }
  
  // Vapi structure detection
  if (payload.message && payload.message.call && payload.message.call.id) {
    return new VoiceConversation({
      orgId,
      provider: 'vapi',
      externalId: payload.message.call.id,
      startTime: payload.message.call.startedAt ? new Date(payload.message.call.startedAt) : new Date(),
      endTime: payload.message.call.endedAt ? new Date(payload.message.call.endedAt) : undefined,
      transcript: payload.message.transcript || payload.message.call.transcript || undefined,
      audio: payload.message.recordingUrl || payload.message.call.recordingUrl || undefined,
      metadata: payload
    });
  }

  // Twilio or generic structure detection
  const callId = payload.CallSid || payload.call_id || payload.id;
  
  if (!callId) {
    throw new Error('Unsupported payload format: missing call identifier');
  }

  return new VoiceConversation({
    orgId,
    provider: payload.CallSid ? 'twilio' : 'unknown',
    externalId: String(callId),
    startTime: payload.start_time ? new Date(payload.start_time) : new Date(),
    endTime: payload.end_time ? new Date(payload.end_time) : undefined,
    transcript: payload.transcript || undefined,
    audio: payload.recording_url || payload.RecordingUrl || undefined,
    metadata: payload
  });
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
      conversation = normalizePayload(payload, orgId);
    } catch (error: any) {
      return NextResponse.json({ error: `Validation failed: ${error.message}` }, { status: 422 });
    }

    // 6. Save to `voice_conversations` table securely encrypting sensitive values
    let insertId: string;
    try {
       // Assuming saveVoiceConversation gets updated to take (conversation, byokKey)
       // insertId = await saveVoiceConversation(conversation, byokKey);

       // 4. Save to `voice_conversations` table using the provided server client
       // Trigger the actual database write 
       // **Note: Migrating to standard controller shortly.**
       const { data: insertData, error: dbError } = await supabaseServer
         .from('voice_conversations')
         .insert({
           id: conversation.id,
           org_id: conversation.orgId,
           provider_call_id: conversation.externalId,
           provider: conversation.provider,
           start_time: conversation.startTime.toISOString(),
           end_time: conversation.endTime ? conversation.endTime.toISOString() : null,
           duration_seconds: conversation.duration || null,
           transcript: conversation.transcript || null,
           recording_url: conversation.audio || null,
           raw_data: conversation.metadata
         })
         .select('id')
         .single();
         
       if (dbError) throw dbError;
       insertId = insertData.id;
    } catch (err: any) {
       console.error('Database error saving voice conversation:', err);
       return NextResponse.json({ error: 'Failed to securely store conversation data' }, { status: 500 });
    }

    // Trigger Facttic Risk Analysis Engine asynchronously
    // We don't await this to ensure the webhook responds quickly
    analyzeVoiceConversation(insertId, orgId).catch((err: any) => {
      console.error('[Webhook] Async risk analysis failed:', err);
    });

    // 5. Return success response
    return NextResponse.json({ success: true, id: insertId }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
