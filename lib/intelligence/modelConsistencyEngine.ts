import crypto from 'crypto';
import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface ConsistencySignal {
  prompt_hash: string;
  model_a: string;
  model_b: string;
  similarity_score: number;
}

export class ModelConsistencyEngine {
  /**
   * Compares behavioral consistency between two models for a given prompt.
   * In this implementation, we simulate model calls and use token-vector-based cosine similarity.
   */
  static async compareModels(prompt: string, modelA: string, modelB: string): Promise<ConsistencySignal> {
    try {
      const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');

      // 1. Simulate Model Responses (In production, these would be external API calls)
      const resA = await this.simulateModelCall(prompt, modelA);
      const resB = await this.simulateModelCall(prompt, modelB);

      // 2. Normalize Responses
      const normA = this.normalizeText(resA);
      const normB = this.normalizeText(resB);

      // 3. Compute Semantic Similarity (Cosine Similarity on token frequencies)
      const similarity = this.computeCosineSimilarity(normA, normB);

      // 4. Persist result
      const { error } = await supabaseServer
        .from('model_consistency_tests')
        .insert({
          prompt_hash: promptHash,
          model_a: modelA,
          model_b: modelB,
          similarity_score: similarity
        });

      if (error) throw error;

      logger.info('MODEL_CONSISTENCY_TEST_COMPLETED', { promptHash, modelA, modelB, similarity });

      return {
        prompt_hash: promptHash,
        model_a: modelA,
        model_b: modelB,
        similarity_score: similarity
      };
    } catch (err: any) {
      logger.error('MODEL_CONSISTENCY_TEST_FAILED', { error: err.message });
      throw err;
    }
  }

  private static async simulateModelCall(prompt: string, model: string): Promise<string> {
    // Deterministic simulation based on model name and prompt
    // This allows testing the similarity engine without real API costs
    if (model.includes('gpt')) {
      return `Answer to "${prompt.substring(0, 10)}...": This is a concise behavioral response characteristic of a GPT model.`;
    }
    return `Answer to "${prompt.substring(0, 10)}...": This is a detailed response characteristic of a Claude or specialized model.`;
  }

  private static normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }

  private static computeCosineSimilarity(textA: string, textB: string): number {
    const tokensA = textA.split(/\s+/);
    const tokensB = textB.split(/\s+/);

    const freqA = this.getFrequencyMap(tokensA);
    const freqB = this.getFrequencyMap(tokensB);

    const allTokens = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (const token of allTokens) {
      const vA = freqA[token] || 0;
      const vB = freqB[token] || 0;
      dotProduct += vA * vB;
      magA += vA * vA;
      magB += vB * vB;
    }

    const similarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
    return isNaN(similarity) ? 0 : parseFloat(similarity.toFixed(4));
  }

  private static getFrequencyMap(tokens: string[]): Record<string, number> {
    return tokens.reduce((map, token) => {
      map[token] = (map[token] || 0) + 1;
      return map;
    }, {} as Record<string, number>);
  }
}
