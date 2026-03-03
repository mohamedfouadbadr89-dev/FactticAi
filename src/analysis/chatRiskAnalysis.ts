import { getChatConversationById } from '@/database/chatConversations';
import { saveRiskScore } from '@/database/voiceRiskScores'; // Reusing identical generic reporting structure for all conversations

// Simulated async LLM or Rules Engine evaluation for OpenAI and Anthropic outputs
async function mockChatEngineEvaluation(text: string, provider: string) {
  await new Promise(resolve => setTimeout(resolve, 800)); 

  let score = 5;
  const flaggedDetails: string[] = [];

  const lowered = text.toLowerCase();
  
  if (lowered.includes('password') || lowered.includes('secret')) {
    score += 40;
    flaggedDetails.push('Credentials Exposure (Chat)');
  }

  // Provider specific hallucinations mock logic
  if (provider === 'openai' && lowered.includes('ignore previous instructions')) {
     score += 70;
     flaggedDetails.push('System Prompt Injection (OpenAI Detected)');
  }
  
  if (provider === 'anthropic' && lowered.includes('human, i am sentient')) {
      score += 35;
      flaggedDetails.push('AI Anthropomorphism Flag (Anthropic)');
  }

  return {
    risk_score: Math.min(score, 100),
    flagged_policies: flaggedDetails
  };
}

/**
 * Executes post-ingestion risk analysis on saved Chat Conversations.
 * Securely decrypts the payload for memory-only evaluation, generates the scores, and inserts 
 * strictly to `voice_risk_scores`. 
 * Note: Decrypted payload is wiped after script execution concludes without hitting disk logs.
 * 
 * @param conversationId Database identifier
 * @param orgId Tenant bounding identifier
 * @param byokKey AES Security access block
 */
export async function analyzeChatConversation(conversationId: string, orgId: string, byokKey: string) {
  try {
    // 1. Decrypt raw payload
    const conversation = await getChatConversationById(conversationId, orgId, byokKey);
    if (!conversation) {
      console.warn(`[Risk Engine] Chat conversation ${conversationId} not found or tenant mismatch for org ${orgId}.`);
      return;
    }

    if (!conversation.transcript) {
      console.warn(`[Risk Engine] No transcript available for chat ${conversationId}. Skipping evaluation.`);
      return; 
    }

    // 2. Evaluate in-memory
    const analysisResult = await mockChatEngineEvaluation(conversation.transcript, conversation.provider);

    // 3. Persist Risk Evaluation bounds (Generic table mapping fits both Chat and Voice safely via FK isolation conceptually mapping any conversation ID)
    await saveRiskScore({
      conversation_id: conversationId,
      org_id: orgId,
      risk_score: analysisResult.risk_score,
      flagged_policies: analysisResult.flagged_policies
    });

  } catch (error) {
    console.error(`[Chat Risk Analysis] Failed to analyze conversation ${conversationId}:`, error);
  }
}
