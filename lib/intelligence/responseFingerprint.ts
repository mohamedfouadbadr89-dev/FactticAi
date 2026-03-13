import { createHash } from 'crypto';

/**
 * Normalizes response text for deterministic fingerprinting.
 * Rules: lowercase, remove whitespace variance, remove punctuation noise.
 */
export function normalizeResponse(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

export interface FingerprintResult {
  fingerprint: string;
  promptHash: string;
  model: string;
  normalizedLength: number;
}

/**
 * Generates a deterministic SHA256 fingerprint for an AI response.
 * fingerprint = SHA256(normalize(response_text) + prompt_hash + model_id + temperature)
 */
export function generateFingerprint(
  responseText: string,
  promptHash: string,
  modelId: string,
  temperature: number = 0
): FingerprintResult {
  const normalized = normalizeResponse(responseText);
  
  const input = `${normalized}${promptHash}${modelId}${temperature}`;
  const fingerprint = createHash('sha256').update(input).digest('hex');

  return {
    fingerprint,
    promptHash,
    model: modelId,
    normalizedLength: normalized.length
  };
}
