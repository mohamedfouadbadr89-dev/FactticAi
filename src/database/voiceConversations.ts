import { VoiceConversation } from '../models/VoiceConversation';
import { encryptData, decryptData } from '../lib/encryption';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * Saves a VoiceConversation to the database, ensuring orgId isolation.
 *
 * @param conversation The validated voice conversation instance
 * @param byokKey Base64 encoded AES key string provided via webhook headers
 * @returns The new inserted ID
 */
export async function saveVoiceConversation(conversation: VoiceConversation, byokKey: string): Promise<string> {
  if (!conversation.orgId) {
    throw new Error('Organization ID is required for a voice conversation.');
  }

  if (!byokKey) {
    throw new Error('Customer BYOK key is mandatory for encrypting voice data.');
  }

  // Deep extract sensitive payload contents
  const sensitivePayload = JSON.stringify({
    transcript: conversation.transcript,
    audio: conversation.audio,
    participants: conversation.participants,
    metadata: conversation.metadata
  });

  // Zero-Knowledge Encryption Step
  const secureCiphertext = encryptData(sensitivePayload, byokKey);

  const { data, error } = await supabaseServer
    .from('voice_conversations')
    .insert({
      id: conversation.id,
      org_id: conversation.orgId,
      provider_call_id: conversation.externalId,
      provider: conversation.provider,
      start_time: conversation.startTime.toISOString(),
      end_time: conversation.endTime ? conversation.endTime.toISOString() : null,
      duration_seconds: conversation.duration || null,
      raw_data: secureCiphertext // Shifting legacy logging structures securely into the BYOK wrapper within the raw_data cell for now
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to save VoiceConversation:', error);
    throw new Error(`Database error saving voice conversation: ${error.message}`);
  }

  return data.id;
}

/**
 * Retrieves a VoiceConversation by its ID and orgId to enforce data isolation.
 *
 * @param id The ID of the voice conversation record
 * @param orgId The organization ID (tenant isolation context)
 * @param byokKey Customer encryption material
 * @returns The VoiceConversation object or null if not found
 */
export async function getVoiceConversationById(id: string, orgId: string, byokKey: string): Promise<VoiceConversation | null> {
  if (!byokKey) {
    throw new Error('Customer BYOK key is mandatory to decrypt database records.');
  }
  if (!id || !orgId) {
    throw new Error('Both id and orgId are required to retrieve a voice conversation.');
  }

  const { data, error } = await supabaseServer
    .from('voice_conversations')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116: Multiple (or no) rows returned.
      // Used by .single() when no rows are found
      return null;
    }
    logger.error('Failed to retrieve VoiceConversation:', error);
    throw new Error(`Database error fetching voice conversation: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Map database columns back to the VoiceConversation instance format
  // Attempt BYOK decryption
  try {
    let transcript, audio, participants, metadata;

    if (data.raw_data && typeof data.raw_data === 'string') {
        const rawPlaintext = decryptData(data.raw_data, byokKey);
        const parsedSensitiveData = JSON.parse(rawPlaintext);

        transcript = parsedSensitiveData.transcript;
        audio = parsedSensitiveData.audio;
        participants = parsedSensitiveData.participants;
        metadata = parsedSensitiveData.metadata;
    }

    return new VoiceConversation({
      id: data.id,
      orgId: data.org_id,
      provider: data.provider,
      externalId: data.provider_call_id,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      duration: data.duration_seconds,
      transcript: transcript || data.transcript || undefined, // Fallbacks for pre-migration data
      audio: audio || data.recording_url || undefined,
      participants: participants || undefined,
      metadata: metadata || {}
    });
  } catch (decryptionError: any) {
     logger.error('[Voice Security] Failed to decrypt voice log using provided BYOK key', decryptionError);
     throw new Error('BYOK Decryption Failed: Invalid key or corrupted ciphertext.');
  }
}
