import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { AgentGuardrails } from './agentGuardrails';

export interface AgentStepInput {
  session_id: string;
  action_type: 'reasoning' | 'llm_call' | 'tool_call' | 'api_call' | 'memory_write';
  tool_name?: string;
  model_name?: string;
  observation?: string;
  risk_score?: number;
}

/**
 * Agent Controller (Phase 55)
 * Monitors agent execution, enforces guardrails, and manages session lifecycle.
 */
export class AgentController {
  /**
   * Starts a new managed agent session.
   */
  static async startSession(orgId: string, agentName: string, sessionId: string) {
    const { data, error } = await supabaseServer
      .from('agent_sessions')
      .insert({
        org_id: orgId,
        agent_name: agentName,
        session_id: sessionId,
        status: 'running',
        steps: 0,
        risk_score: 0
      })
      .select()
      .single();

    if (error) {
      logger.error('AGENT_SESSION_START_FAILED', { error: error.message, sessionId });
      throw error;
    }

    return data;
  }

  /**
   * Logs a step and evaluates guardrails.
   */
  static async processStep(input: AgentStepInput) {
    try {
      // 1. Fetch current session state
      const { data: session, error: sessError } = await supabaseServer
        .from('agent_sessions')
        .select('*')
        .eq('session_id', input.session_id)
        .single();

      if (sessError || !session) throw new Error('AGENT_SESSION_NOT_FOUND');

      const stepNumber = (session.steps || 0) + 1;

      // 2. Evaluate Guardrails
      const assessment = await AgentGuardrails.evaluateStep(session, input);

      // 3. Persist Step
      await supabaseServer.from('agent_steps').insert({
        session_id: input.session_id,
        step_number: stepNumber,
        action_type: input.action_type,
        tool_name: input.tool_name,
        model_name: input.model_name,
        observation: input.observation,
        risk_score: input.risk_score || 0
      });

      // 4. Update Session State
      const newStatus = assessment.action === 'block' ? 'blocked' : session.status;
      const newRisk = Math.max(session.risk_score || 0, input.risk_score || 0);

      await supabaseServer
        .from('agent_sessions')
        .update({
          steps: stepNumber,
          status: newStatus,
          risk_score: newRisk
        })
        .eq('id', session.id);

      return {
        action: assessment.action,
        status: newStatus,
        issues: assessment.issues
      };

    } catch (err: any) {
      logger.error('AGENT_STEP_PROCESSING_FAILED', { error: err.message, sid: input.session_id });
      return { action: 'allow', status: 'running', issues: [] };
    }
  }

  /**
   * Manually controls an agent session.
   */
  static async controlSession(sessionId: string, action: 'pause' | 'resume' | 'block' | 'escalate') {
    const statusMap: Record<string, string> = {
      pause: 'paused',
      resume: 'running',
      block: 'blocked',
      escalate: 'escalated'
    };

    const { data, error } = await supabaseServer
      .from('agent_sessions')
      .update({ status: statusMap[action] })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Seed demo agent data for the dashboard.
   */
  static async seedDemoAgents(orgId: string) {
    const sessionId = `agent_${Math.random().toString(36).slice(2, 9)}`;
    await this.startSession(orgId, 'GovernanceBot-v1', sessionId);

    const steps: AgentStepInput[] = [
      { session_id: sessionId, action_type: 'reasoning', observation: 'Analyzing user request to analyze cloud spend.' },
      { session_id: sessionId, action_type: 'tool_call', tool_name: 'aws_cost_explorer', risk_score: 10 },
      { session_id: sessionId, action_type: 'llm_call', model_name: 'gpt-4o', risk_score: 5 },
      { session_id: sessionId, action_type: 'tool_call', tool_name: 'rm_rf', risk_score: 95 } // Trigger block
    ];

    for (const step of steps) {
      await this.processStep(step);
    }

    return { session_id: sessionId };
  }
}
