import { NextRequest, NextResponse } from 'next/server';
import { ProviderResilienceEngine } from '@/lib/resilience/providerResilienceEngine';
import { logger } from '@/lib/logger';

/**
 * Provider Health Surveillance API
 */
export async function GET(req: NextRequest) {
  try {
    const statuses = await ProviderResilienceEngine.getProviderStatus();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      providers: statuses
    });

  } catch (err: any) {
    logger.error('PROVIDER_HEALTH_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
