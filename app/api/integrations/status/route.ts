import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { ConnectorRegistry } from '@/src/connectors/ConnectorRegistry';
import { Auth0Connector } from '@/src/connectors/implementations/Auth0Connector';
import { DatadogConnector } from '@/src/connectors/implementations/DatadogConnector';
import { PagerDutyConnector } from '@/src/connectors/implementations/PagerDutyConnector';
import { VapiConnector } from '@/src/connectors/implementations/VapiConnector';
import { RetellConnector } from '@/src/connectors/implementations/RetellConnector';
import { ElevenLabsConnector } from '@/src/connectors/implementations/ElevenLabsConnector';
import { logger } from '@/lib/logger';

// Lazy loading / singleton orchestration — each connector initialized independently
let initialized = false;
async function initializeRegistry() {
  if (initialized) return;
  const registry = ConnectorRegistry.getInstance();

  const connectors = [
    { ctor: () => new Auth0Connector(), config: {} },
    { ctor: () => new DatadogConnector(), config: {} },
    { ctor: () => new PagerDutyConnector(), config: {} },
    { ctor: () => new VapiConnector(), config: { endpoint: 'https://api.vapi.ai', apiKey: process.env.VAPI_API_KEY || '' } },
    { ctor: () => new RetellConnector(), config: { endpoint: 'https://api.retellai.com', apiKey: process.env.RETELL_API_KEY || '' } },
    { ctor: () => new ElevenLabsConnector(), config: { endpoint: 'https://api.elevenlabs.io/v1', apiKey: process.env.ELEVENLABS_API_KEY || '' } },
  ];

  await Promise.allSettled(
    connectors.map(async ({ ctor, config }) => {
      try {
        const c = ctor();
        await c.initialize(config);
        registry.register(c);
      } catch {
        // connector unavailable — skip silently
      }
    })
  );

  initialized = true;
}

export const GET = withAuth(async (req: Request, _ctx: AuthContext) => {
  try {
    await initializeRegistry();
    const registry = ConnectorRegistry.getInstance();
    
    // Fetch live status
    const statuses = await registry.healthcheckAll();
    
    return NextResponse.json({ statuses });
  } catch (error: any) {
    logger.error('INTEGRATION_STATUS_ERROR', { error: error.message });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
});
