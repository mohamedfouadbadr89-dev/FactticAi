import { VoiceConversation } from '../models/VoiceConversation';

/**
 * Heuristic engine recursively asserting that the incoming JSON payload is free of XSS payloads.
 * Targets <script>, javascript: pseudo-protocols, and inline event handlers (onerror, onload).
 */
export function detectXSS(currentValue: any): boolean {
  if (typeof currentValue === 'string') {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi,                                     // Javascript pseudo-protocol
      /(onerror|onload|onmouseover|onclick)\s*=/gi        // Inline event handlers
    ];
    return maliciousPatterns.some(pattern => pattern.test(currentValue));
  }
  
  if (Array.isArray(currentValue)) {
    return currentValue.some(item => detectXSS(item));
  }
  
  if (typeof currentValue === 'object' && currentValue !== null) {
    return Object.values(currentValue).some(value => detectXSS(value));
  }
  
  return false;
}


/**
 * Normalizes different voice provider payloads into a standard VoiceConversation
 *
 * Supported providers: Vapi, Retell, ElevenLabs, Pipecat, Twilio (generic)
 */
export function normalizeConversationData(payload: any, orgId: string): VoiceConversation {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: expected an object');
  }

  // Security Verification (OWASP A03: Injection)
  if (detectXSS(payload)) {
    throw new Error('XSS Attack Detected. Payload normalization aborted maliciously formatted payloads.');
  }

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

  // ElevenLabs structure detection
  if (payload.agent_id && payload.call_id) {
    return new VoiceConversation({
      orgId,
      provider: 'elevenlabs',
      externalId: payload.call_id,
      startTime: payload.start_timestamp ? new Date(payload.start_timestamp) : new Date(),
      endTime: payload.end_timestamp ? new Date(payload.end_timestamp) : undefined,
      transcript: payload.transcript || undefined,
      audio: payload.recording_url || undefined,
      metadata: payload
    });
  }

  // Pipecat structure detection
  if (payload.bot_id && payload.session_id) {
    return new VoiceConversation({
      orgId,
      provider: 'pipecat',
      externalId: payload.session_id,
      startTime: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      transcript: payload.transcript || undefined,
      audio: payload.recording_url || undefined,
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
