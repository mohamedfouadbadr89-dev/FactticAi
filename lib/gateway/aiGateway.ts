import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { RuntimeInterceptor } from '../governance/runtimeInterceptor';
import { RoutingBrain, RoutingMode } from './routingBrain';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'local_llm';

export interface GatewayRequest {
  provider?: AIProvider;
  model?: string;
  prompt: string;
  routing_mode?: RoutingMode;
}

export interface GatewayResponse {
  response: string;
  request_tokens: number;
  response_tokens: number;
  latency_ms: number;
  risk_score: number;
  action: string;
}

/**
 * AI Gateway Engine (Phase 50)
 * Central routing and governance for all LLM traffic.
 */
export class AiGateway {
  /**
   * Routes a request to an LLM provider while enforcing governance and tracking metrics.
   */
  static async route(orgId: string, params: GatewayRequest): Promise<GatewayResponse> {
    const start = Date.now();
    const { prompt, routing_mode } = params;
    let { provider, model } = params;

    try {
      // 0. DYNAMIC ROUTING (Phase 54)
      if (!provider || !model || routing_mode) {
        const decision = await RoutingBrain.selectModel(routing_mode || 'auto', { orgId });
        provider = decision.provider as AIProvider;
        model = decision.selected_model;
      }

      // 1. SIMULATE PROVIDER EXECUTION (Pluggable for real API keys)
      const simulatedResponse = this.simulateProvider(provider, model, prompt);
      const latency_ms = Date.now() - start + (Math.random() * 200); // Add jitter
      
      const request_tokens = prompt.split(' ').length * 1.3;
      const response_tokens = simulatedResponse.split(' ').length * 1.3;

      // 2. RUN REAL-TIME INTERCEPTION (Phase 48/49 integration)
      const intercept = await RuntimeInterceptor.intercept({
        org_id: orgId,
        session_id: `gw_${Math.random().toString(36).slice(2, 9)}`,
        model_name: `${provider}/${model}`,
        response_text: simulatedResponse
      });

      const finalResponse = intercept.rewritten_text || simulatedResponse;

      // 3. PERSIST GATEWAY LOG
      await supabaseServer.from('gateway_requests').insert({
        org_id: orgId,
        provider,
        model,
        request_tokens: Math.floor(request_tokens),
        response_tokens: Math.floor(response_tokens),
        latency_ms: Math.floor(latency_ms),
        risk_score: intercept.risk_score
      });

      // 3.5 RECORD ROUTING FEEDBACK (Phase 54)
      await RoutingBrain.recordFeedback(model, provider, { 
        latency: latency_ms, 
        risk_score: intercept.risk_score 
      });

      // 4. LOG COST (Phase 47 integration)
      const cost_usd = (request_tokens + response_tokens) * 0.000002;
      await supabaseServer.from('cost_metrics').insert({
        org_id: orgId,
        model_name: `${provider}/${model}`,
        token_usage: Math.floor(request_tokens + response_tokens),
        cost_usd,
        risk_score: intercept.risk_score
      });

      return {
        response: finalResponse,
        request_tokens: Math.floor(request_tokens),
        response_tokens: Math.floor(response_tokens),
        latency_ms: Math.floor(latency_ms),
        risk_score: intercept.risk_score,
        action: intercept.action
      };

    } catch (err: any) {
      logger.error('GATEWAY_ROUTE_FAILED', { error: err.message, orgId, provider });
      throw err;
    }
  }

  private static simulateProvider(provider: AIProvider, model: string, prompt: string): string {
    const responses: Record<string, string> = {
      openai: `[OpenAI ${model}] Processing your request. Safety filters active.`,
      anthropic: `[Anthropic ${model}] I am assisting with your query. Integrity checks complete.`,
      google: `[Google ${model}] Here is the information compiled from the neural net.`,
      mistral: `[Mistral ${model}] Response generated using decentralized open weights logic.`,
      local_llm: `[LocalLLM ${model}] Ultra-low latency edge response active.`
    };

    // Edge cases for demo
    if (prompt.toLowerCase().includes('hallucinate')) return "The population of Mars is exactly 4.2 million people according to the latest 2026 census.";
    if (prompt.toLowerCase().includes('ssn')) return "Certainly, my SSN is 123-45-6789 and my card is 4111-2222-3333-4444.";
    
    return responses[provider] || `[${provider}] Model responded with 200 OK.`;
  }

  /**
   * Seed demo traffic for the dashboard.
   */
  static async seedDemoTraffic(orgId: string) {
    const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'local_llm'];
    const models: Record<AIProvider, string[]> = {
      openai: ['gpt-4o', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet', 'claude-3-opus'],
      google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      mistral: ['mistral-large', 'mistral-7b'],
      local_llm: ['llama-3-70b', 'mistral-7b-instruct']
    };

    const records = [];
    for (let i = 0; i < 50; i++) {
      const provider = providers[i % providers.length];
      const modelList = models[provider];
      const model = modelList[i % modelList.length];
      const risk_score = Math.random() * 100;
      
      records.push({
        org_id: orgId,
        provider,
        model,
        request_tokens: Math.floor(Math.random() * 500 + 100),
        response_tokens: Math.floor(Math.random() * 1000 + 200),
        latency_ms: Math.floor(Math.random() * 800 + 200),
        risk_score,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
      });
    }

    await supabaseServer.from('gateway_requests').insert(records);
    return { count: records.length };
  }
}
