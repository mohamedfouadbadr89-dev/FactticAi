/**
 * Provider Verification System
 * 
 * CORE REQUIREMENT: Before saving a connection, Facttic must verify that 
 * the provided API credentials are valid and the provider is responsive.
 */

export interface VerificationResult {
  success: boolean;
  message: string;
  latency?: number;
  status?: string;
}

export async function verifyProviderConnection(
  providerId: string, 
  config: Record<string, string>
): Promise<VerificationResult> {
  const start = Date.now();
  const { apiKey, endpoint, agentId, voiceId, workspaceId, pathwayId } = config;

  try {
    switch (providerId) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Invalid API key or OpenAI service unavailable.');
        break;
      }

      case 'anthropic': {
        // Anthropic requires a bit more than just a list but models works for auth check
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }]
          })
        });
        if (res.status === 401) throw new Error('Invalid Anthropic API key.');
        break;
      }

      case 'elevenlabs': {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey }
        });
        if (!res.ok) throw new Error('Invalid ElevenLabs API key.');
        break;
      }

      case 'vapi': {
        const res = await fetch('https://api.vapi.ai/agent', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Invalid Vapi Private Key or Agent configuration.');
        break;
      }

      case 'retell': {
        const res = await fetch('https://api.retellai.com/get-retell-llm-list', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Invalid Retell API key or Workspace configuration.');
        break;
      }

      case 'bland': {
        const res = await fetch('https://api.bland.ai/v1/agents', {
          headers: { 'Authorization': apiKey }
        });
        if (!res.ok) throw new Error('Invalid Bland AI key.');
        break;
      }

      case 'pipecat':
      case 'custom':
      case 'azure': {
        // For Azure and Custom, we ping the provided endpoint
        const target = endpoint || 'https://api.openai.com/v1/models'; // fallback
        const res = await fetch(target, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`Connectivity failed: ${providerId} endpoint returned ${res.status}`);
        break;
      }

      default:
        return { success: false, message: `Verification not implemented for ${providerId}` };
    }

    const latency = Date.now() - start;
    return {
      success: true,
      message: 'Connection Successful',
      latency,
      status: 'Operational'
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Verification failed due to a network error.'
    };
  }
}
