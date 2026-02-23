import { NextResponse } from 'next/server';

/**
 * API Health Check
 * 
 * LEVEL 1 Execution.
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'facttic-core',
    version: '1.0.0'
  });
}
