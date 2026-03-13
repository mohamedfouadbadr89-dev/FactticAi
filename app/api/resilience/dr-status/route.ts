import { NextRequest, NextResponse } from 'next/server';
import { DisasterRecoveryMonitor } from '@/lib/resilience/disasterRecoveryMonitor';

export async function GET(req: NextRequest) {
  try {
    const status = await DisasterRecoveryMonitor.getHealthStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve DR status' }, { status: 500 });
  }
}
