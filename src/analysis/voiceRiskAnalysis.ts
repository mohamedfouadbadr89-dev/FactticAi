import { VoiceConversation } from '../models/VoiceConversation';
import { saveRiskScore } from '../database/voiceRiskScores';
import { logger } from '@/lib/logger';

export interface RiskAnalysisResult {
  score: number;
  violations: string[];
}

/**
 * Analyzes a voice conversation for risk and policy violations
 * 
 * @param conversation The VoiceConversation object to analyze
 * @returns The resulting risk score and any recorded violations
 */
export async function analyzeVoiceConversation(conversation: VoiceConversation): Promise<RiskAnalysisResult | null> {
  try {
    if (!conversation) {
      console.warn(`[Risk Engine] Voice conversation missing. Aborting analysis.`);
      return null;
    }

    const conversationId = conversation.id;
    const orgId = conversation.orgId;

    console.log(`[Risk Engine] Starting analysis for conversation ${conversationId}...`);
    
    let score = 0;
    const violations: string[] = [];

    // Basic heuristic analysis for the payload
    const transcript = (conversation.transcript || '').toLowerCase();
    
    // Analyze sentiment/topics
    if (transcript.includes('angry') || transcript.includes('cancel') || transcript.includes('frustrat')) {
      score += 30;
      violations.push('Negative sentiment detected');
    }
    
    if (transcript.includes('lawsuit') || transcript.includes('sue') || transcript.includes('lawyer')) {
      score += 50;
      violations.push('Legal threat detected');
    }

    // PII Detection (basic regex overlay)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/;

    if (ssnRegex.test(transcript) || creditCardRegex.test(transcript)) {
      score += 40;
      violations.push('Potential PII exposure (SSN/CC)');
    }

    if (score > 100) score = 100;

    const result = {
      score,
      violations
    };

    try {
      await saveRiskScore({
        conversationId: conversationId,
        orgId: orgId,
        riskScore: result.score,
        flaggedPolicies: result.violations,
        createdAt: new Date().toISOString()
      });
    } catch (saveError: any) {
      logger.error(`[Risk Engine] Error persisting analysis results for ${conversationId}:`, saveError);
      throw new Error(`Failed to update conversation with risk analysis: ${saveError.message}`);
    }

    console.log(`[Risk Engine] Analysis complete for conversation ${conversationId}. Score: ${result.score}`);
    
    return result;
  } catch (err: any) {
    logger.error(`[Risk Engine] Analysis failed for conversation ${conversation?.id}:`, err);
    throw err;
  }
}

