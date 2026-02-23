import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  logger.info('Daily automated health check executed', {
    source: 'cron'
  });
  
  return NextResponse.json({ success: true, message: 'Health check OK' });
}
