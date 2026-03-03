import { getVoiceConversationById } from '@/database/voiceConversations';
import { saveRiskScore } from '@/database/voiceRiskScores';

export interface RiskAnalysisResult {
  score: number;
  violations: string[];
}

/**
 * Analyzes a voice conversation for risk and policy violations
 * 
 * @param conversationId The ID of the conversation to analyze
 * @param orgId The organization ID owning the conversation (for data isolation)
 * @returns The resulting risk score and any recorded violations
 */
export async function analyzeVoiceConversation(conversationId: string, orgId: string): Promise<RiskAnalysisResult | null> {
  try {
    const conversation = await getVoiceConversationById(conversationId, orgId);

    if (!conversation) {
      console.warn(`[Risk Engine] Voice conversation ${conversationId} not found for org ${orgId}. Aborting analysis.`);
      return null;
    }

    console.log(`[Risk Engine] Starting analysis for conversation ${conversationId}...`);
    
    // Simulate Facttic Risk Engine Processing
    // In a real implementation this would contact internal LLM routers or inference engines
    const mockScore = Math.floor(Math.random() * 100);
    const mockViolations = mockScore > 75 
      ? ['High risk detection keyword matched', 'Potential SLA breach'] 
      : [];

    try {
      await saveRiskScore({
        conversationId: conversationId,
        orgId: orgId,
        riskScore: mockScore,
        flaggedPolicies: mockViolations,
        createdAt: new Date().toISOString()
      });
    } catch (saveError: any) {
      console.error(`[Risk Engine] Error persisting analysis results for ${conversationId}:`, saveError);
      throw new Error(`Failed to update conversation with risk analysis: ${saveError.message}`);
    }

    console.log(`[Risk Engine] Analysis complete for conversation ${conversationId}. Score: ${mockScore}`);
    
    return {
      score: mockScore,
      violations: mockViolations,
    };
  } catch (err: any) {
    console.error(`[Risk Engine] Analysis failed for conversation ${conversationId}:`, err);
    throw err;
  }
}
