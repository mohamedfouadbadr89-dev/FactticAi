import { createHash } from 'crypto';

export interface AnonymizedSignal {
  model_name: string;
  signal_type: string;
  risk_score: number;
  pattern_hash: string;
}

/**
 * Anonymizer Layer (Phase 53)
 * Strips all tenant-identifiable data from governance signals.
 */
export class Anonymizer {
  /**
   * Transforms a local governance signal into a globally safe, anonymized trace.
   */
  static anonymize(model: string, type: string, score: number, details?: string): AnonymizedSignal {
    // 1. Remove raw text, orgIDs, sessionIDs (not passed in)
    
    // 2. Generate deterministic pattern hash for clustering
    // Hash = sha256(model + type + risk_bucket)
    const riskBucket = this.getRiskBucket(score);
    const rawPattern = `${model}:${type}:${riskBucket}:${details || ''}`;
    
    const patternHash = createHash('sha256')
      .update(rawPattern)
      .digest('hex');

    return {
      model_name: model,
      signal_type: type,
      risk_score: score,
      pattern_hash: patternHash
    };
  }

  private static getRiskBucket(score: number): string {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }
}
