import { supabaseServer } from './supabaseServer';

export interface AgentInfo {
  id: string;
  org_id: string;
  name: string;
  type: string;
  version: string;
  is_active: boolean;
}

/**
 * Deterministic Agent Resolver
 * 
 * Validates that an agent belongs to the given organization and is active.
 * Used to prevent cross-org leaks and ensure only valid agents are used in sessions.
 */
export const resolveAgentContext = async (agentId: string, orgId: string): Promise<AgentInfo> => {
  const { data: agent, error } = await supabaseServer
    .from('agents')
    .select('id, org_id, name, type, version, is_active')
    .eq('id', agentId)
    .eq('org_id', orgId) // Strict ownership check
    .single();

  if (error || !agent) {
    throw new Error('Agent not found or unauthorized access.');
  }

  if (!agent.is_active) {
    throw new Error('Agent is currently inactive.');
  }

  return agent as AgentInfo;
};
