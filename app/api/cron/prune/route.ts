import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isFeatureEnabled } from '@/config/featureFlags';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  if (!isFeatureEnabled('SESSION_RETENTION_PRUNING')) {
    return NextResponse.json({ success: false, message: 'Feature flag disabled' }, { status: 403 });
  }

  logger.info('Executing time-based session retention pruning', { source: 'cron' });
  
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - 30);
  const cutoff = retentionDate.toISOString();

  try {
    // Perform actual database deletion for records older than 30 days
    const [sessionsResult, auditResult] = await Promise.all([
      supabaseServer.from('sessions').delete({ count: 'exact' }).lt('created_at', cutoff),
      supabaseServer.from('audit_logs').delete({ count: 'exact' }).lt('created_at', cutoff)
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (auditResult.error) throw auditResult.error;

    const totalPruned = (sessionsResult.count || 0) + (auditResult.count || 0);
    logger.info(`Pruned ${totalPruned} expired audit logs/sessions based on 30-day retention policy`);

    return NextResponse.json({
      success: true,
      pruned_count: totalPruned,
      message: 'Time-based pruning complete'
    });
  } catch (error: any) {
    logger.error('Failed to prune database records:', { error: error.message });
    return NextResponse.json({ success: false, error: 'Pruning operation failed' }, { status: 500 });
  }
}
