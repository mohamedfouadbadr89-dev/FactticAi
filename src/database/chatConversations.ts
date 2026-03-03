import { supabaseServer } from '../lib/supabaseServer';
import { ChatConversation } from '../models/ChatConversation';
import { encryptData, decryptData } from '../lib/encryption';

/**
 * Saves an encrypted ChatConversation object into the database.
 * The payload MUST include the customer's base64 BYOK key to encrypt transcripts or raw elements prior to hitting the database.
 * 
 * @param conversation The validated chat conversation instance
 * @param byokKey Base64 encoded AES key string provided via webhook headers
 * @returns The new inserted ID
 */
export async function saveChatConversation(conversation: ChatConversation, byokKey: string): Promise<string> {
  if (!conversation.orgId) {
    throw new Error('Organization ID is required for a chat conversation.');
  }

  if (!byokKey) {
    throw new Error('Customer BYOK key is mandatory for encrypting chat data.');
  }

  // Deep extract sensitive payload contents
  const sensitivePayload = JSON.stringify({
    transcript: conversation.transcript,
    participants: conversation.participants,
    metadata: conversation.metadata
  });

  // Zero-Knowledge Encryption Step
  const secureCiphertext = encryptData(sensitivePayload, byokKey);

  const { data, error } = await supabaseServer
    .from('chat_conversations')
    .insert({
      id: conversation.id,
      org_id: conversation.orgId,
      provider: conversation.provider,
      external_id: conversation.externalId,
      encrypted_data: secureCiphertext,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save ChatConversation:', error);
    throw new Error(`Database error saving chat conversation: ${error.message}`);
  }

  return data.id;
}

/**
 * Retrieves a ChatConversation by ID and Org ID, decrypting the payload back into its readable structure using the BYOK key.
 * 
 * @param id The conversation reference
 * @param orgId The tenant isolation context
 * @param byokKey Customer encryption material
 */
export async function getChatConversationById(id: string, orgId: string, byokKey: string): Promise<ChatConversation | null> {
  if (!byokKey) {
    throw new Error('Customer BYOK key is mandatory to decrypt database records.');
  }

  const { data, error } = await supabaseServer
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found for tenant, strict isolation returning empty
    }
    throw new Error(`Failed to retrieve chat conversation: ${error.message}`);
  }

  // Attempt BYOK decryption
  try {
    const rawPlaintext = decryptData(data.encrypted_data, byokKey);
    const parsedSensitiveData = JSON.parse(rawPlaintext);

    return new ChatConversation({
      id: data.id,
      orgId: data.org_id,
      provider: data.provider,
      externalId: data.external_id,
      startTime: new Date(data.created_at), // Assuming created_at maps to logging ingestion start
      transcript: parsedSensitiveData.transcript,
      participants: parsedSensitiveData.participants,
      metadata: parsedSensitiveData.metadata,
      encryptedData: data.encrypted_data,
    });
  } catch (decryptionError: any) {
     console.error('[Chat Security] Failed to decrypt chat log using provided BYOK key', decryptionError);
     throw new Error('BYOK Decryption Failed: Invalid key or corrupted ciphertext.');
  }
}
