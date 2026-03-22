import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { RuntimeInterceptor } from '../governance/runtimeInterceptor';
import { RoutingBrain, RoutingMode } from './routingBrain';
import { EncryptionVault } from '../security/encryptionVault';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'local_llm';

export interface GatewayRequest {
  provider?: AIProvider;
  model?: string;
  prompt: string;
  routing_mode?: RoutingMode;
  session_id?: string;
}

export interface GatewayResponse {
  response: string;
  provider: AIProvider;
  model: string;
  request_tokens: number;
  response_tokens: number;
  latency_ms: number;
  risk_score: number;
  action: string;
}

/**
 * AI Gateway Engine (Phase 50) - EXTENDED
 * Central routing and governance for all LLM traffic.
 */
export class AiGateway {
  /**
   * Routes a request to an LLM provider while enforcing governance and tracking metrics.
   * OpenAI is primary, Anthropic is fallback.
   * Supports BYOK (Bring Your Own Key) via EncryptionVault.
   */
  static async route(orgId: string, params: GatewayRequest): Promise<GatewayResponse> {
    const start = Date.now();
    const { prompt, routing_mode, session_id } = params;
    let { provider, model } = params;
    
    const sessionId = session_id || `gw_${Math.random().toString(36).slice(2, 9)}`;

    try {
      // 0. DYNAMIC ROUTING (Phase 54)
      if (!provider || !model || routing_mode) {
        const decision = await RoutingBrain.selectModel(routing_mode || 'auto', { orgId });
        provider = decision.provider as AIProvider;
        model = decision.selected_model;
      }

      // 0.5 FETCH BYOK CREDENTIALS (Phase 51)
      const { data: connection } = await supabaseServer
        .from('ai_connections')
        .select('encrypted_api_key, provider_type, model')
        .eq('org_id', orgId)
        .eq('provider_type', provider)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      let resolvedApiKey: string | undefined = undefined;
      if (connection?.encrypted_api_key) {
        try {
          resolvedApiKey = await EncryptionVault.decryptField(connection.encrypted_api_key, orgId);
          logger.info('BYOK_KEY_RESOLVED', { orgId, provider });
        } catch (decErr) {
          logger.error('BYOK_DECRYPTION_FAILED', { orgId, provider });
        }
      }

      // 1. EXECUTE LLM (Primary: OpenAI, Fallback: Anthropic)
      let llmResult;
      try {
        llmResult = await this.callOpenAI(model || 'gpt-4o-mini', prompt, resolvedApiKey);
      } catch (e) {
        logger.warn('OPENAI_FAILED_FALLING_BACK', { error: (e as Error).message, orgId });
        try {
          // Note: for fallback we currently use env key since we don't have the connection for the fallback provider here easily
          llmResult = await this.callAnthropic(model || 'claude-3-5-sonnet', prompt);
        } catch (e2) {
          logger.error('ALL_PROVIDERS_FAILED', { error: (e2 as Error).message, orgId });
          throw new Error('All LLM providers failed. Request blocked for safety.');
        }
      }

      const { response: rawResponse, provider: finalProvider, model: finalModel, usage } = llmResult;
      const latency_ms = Date.now() - start;

      // 2. RUN REAL-TIME INTERCEPTION (Phase 48/49 integration)
      const intercept = await RuntimeInterceptor.intercept({
        org_id: orgId,
        session_id: sessionId,
        model_name: `${finalProvider}/${finalModel}`,
        response_text: rawResponse
      });

      const finalResponseText = intercept.rewritten_text || rawResponse;

      // 3. PERSIST LOGS (New Extended Tables)
      const resInsert = await supabaseServer.from('responses').insert({
        org_id: orgId,
        session_id: sessionId,
        prompt,
        response: finalResponseText,
        provider: finalProvider,
        model: finalModel,
        latency_ms,
        request_tokens: usage.prompt_tokens,
        response_tokens: usage.completion_tokens,
        tokens_used: usage.total_tokens,
        status: intercept.action === 'block' ? 'blocked' : 'success'
      }).select().single();

      if (resInsert.data) {
        await supabaseServer.from('model_outputs').insert({
          org_id: orgId,
          response_id: resInsert.data.id,
          raw_output: rawResponse,
          model: finalModel,
          provider: finalProvider,
          tokens: usage.total_tokens,
          finish_reason: 'stop'
        });
      }

      await supabaseServer.from('ai_logs').insert({
        org_id: orgId,
        session_id: sessionId,
        action: 'gateway_route',
        provider: finalProvider,
        model: finalModel,
        status: 'success',
        latency_ms,
        full_trace: { usage, intercept_action: intercept.action }
      });

      // Maintain legacy table
      await supabaseServer.from('gateway_requests').insert({
        org_id: orgId,
        provider: finalProvider,
        model: finalModel,
        request_tokens: usage.prompt_tokens,
        response_tokens: usage.completion_tokens,
        latency_ms,
        risk_score: intercept.risk_score
      });

      await RoutingBrain.recordFeedback(finalModel, finalProvider, { 
        latency: latency_ms, 
        risk_score: intercept.risk_score 
      });

      return {
        response: finalResponseText,
        provider: finalProvider as AIProvider,
        model: finalModel,
        request_tokens: usage.prompt_tokens,
        response_tokens: usage.completion_tokens,
        latency_ms,
        risk_score: intercept.risk_score,
        action: intercept.action
      };

    } catch (err: any) {
      logger.error('GATEWAY_ROUTE_FAILED', { error: err.message, orgId, provider });
      
      await supabaseServer.from('ai_logs').insert({
        org_id: orgId,
        session_id: sessionId,
        action: 'gateway_route',
        status: 'failed',
        error: err.message,
        full_trace: { params }
      });

      throw err;
    }
  }

  private static async callOpenAI(model: string, prompt: string, apiKeyOverride?: string) {
    const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY missing');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
    const data = await res.json();
    
    return {
      response: data.choices[0].message.content,
      provider: 'openai',
      model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
      }
    };
  }

  private static async callAnthropic(model: string, prompt: string, apiKeyOverride?: string) {
    const apiKey = apiKeyOverride || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model.includes('claude') ? model : 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`);
    const data = await res.json();
    
    return {
      response: data.content[0].text,
      provider: 'anthropic',
      model,
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };
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


