import { NextRequest, NextResponse } from 'next/server';
import { AdvancedTelemetryEngine } from '@/lib/observability/advancedTelemetryEngine';
import { logger } from '@/lib/logger';

/**
 * Advanced Observability API
 * 
 * Returns deep telemetry insights into governance latency, 
 * alert propagation, and signal integrity.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || '00000000-0000-0000-0000-000000000000'; // Default for system overview

    const metrics = await AdvancedTelemetryEngine.computeAdvancedMetrics(orgId);

    return NextResponse.json(metrics);

  } catch (err: any) {
    logger.error('OBSERVABILITY_API_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
