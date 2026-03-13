import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

export interface RiskScoreRecord {
  id: string;
  conversation_id: string;
  org_id: string;
  risk_score: number;
  flagged_policies: string[];
  created_at: string;
}

export interface RiskScoreInput {
  conversationId: string;
  orgId: string;
  riskScore: number;
  flaggedPolicies: string[];
  createdAt?: string;
}

/**
 * Saves a new risk score for a voice conversation into the database.
 * 
 * @param input The risk score details to save
 * @returns The populated DB record or its ID
 */
export async function saveRiskScore(input: RiskScoreInput): Promise<string> {
  if (!input.conversationId || !input.orgId) {
    throw new Error('conversationId and orgId are required to save a risk score.');
  }

  const { data, error } = await supabaseServer
    .from('voice_risk_scores')
    .insert({
      conversation_id: input.conversationId,
      org_id: input.orgId,
      risk_score: input.riskScore,
      flagged_policies: input.flaggedPolicies || [],
      created_at: input.createdAt || new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to save RiskScore:', error);
    throw new Error(`Database error saving risk score: ${error.message}`);
  }

  return data.id;
}

/**
 * Retrieves all risk scores for a given conversation ID and orgId.
 * Ensures data isolation by filtering by both conditions.
 * 
 * @param conversationId The ID of the conversation
 * @param orgId The Organization ID (tenant)
 * @returns Array of RiskScoreRecord
 */
export async function getRiskScoresByConversationId(conversationId: string, orgId: string): Promise<RiskScoreRecord[]> {
  if (!conversationId || !orgId) {
    throw new Error('Both conversationId and orgId are required to fetch risk scores.');
  }

  // The prompt mentions "join the voice_conversations and voice_risk_scores tables on both the conversation_id and the org_id"
  // However, since we store org_id directly in voice_risk_scores, we can just query the voice_risk_scores table 
  // with eq('conversation_id') and eq('org_id') to guarantee isolation.
  // Alternatively, if we MUST do an explicit join as per the text "modify the getRiskScoresByConversationId function to join the voice_conversations and voice_risk_scores tables" we can use Supabase's foreign key joining syntax:
  // e.g. .select('*, voice_conversations!inner(id, org_id)')

  const { data, error } = await supabaseServer
    .from('voice_risk_scores')
    .select(`
      id,
      conversation_id,
      org_id,
      risk_score,
      flagged_policies,
      created_at,
      voice_conversations!inner(id, org_id)
    `)
    .eq('conversation_id', conversationId)
    .eq('org_id', orgId);

  if (error) {
    logger.error('Failed to retrieve RiskScores:', error);
    throw new Error(`Database error fetching risk scores: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    org_id: row.org_id,
    risk_score: row.risk_score,
    flagged_policies: row.flagged_policies,
    created_at: row.created_at,
  }));
}
