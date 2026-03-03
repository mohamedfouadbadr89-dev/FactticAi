import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { ConnectorRegistry } from '@/src/connectors/ConnectorRegistry';
import { Auth0Connector } from '@/src/connectors/implementations/Auth0Connector';
import { DatadogConnector } from '@/src/connectors/implementations/DatadogConnector';
import { PagerDutyConnector } from '@/src/connectors/implementations/PagerDutyConnector';
import { logger } from '@/lib/logger';

// Lazy loading / singleton orchestration
let initialized = false;
async function initializeRegistry() {
  if (initialized) return;
  const registry = ConnectorRegistry.getInstance();
  
  // Registering with mock/missing config for demo purposes.
  // In a real env, these would be loaded from env vars or the database securely.
  const auth0 = new Auth0Connector();
  await auth0.initialize({});
  registry.register(auth0);

  const dd = new DatadogConnector();
  await dd.initialize({});
  registry.register(dd);

  const pd = new PagerDutyConnector();
  await pd.initialize({});
  registry.register(pd);

  initialized = true;
}

export const GET = withAuth(async (req: Request, { role }: AuthContext) => {
  try {
    // Requires admin level to view integration health
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

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
