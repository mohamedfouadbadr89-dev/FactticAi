import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { withAuth, type AuthContext } from '@/lib/middleware/auth';

/**
 * GET /api/ledger/verify
 * 
 * Cryptographically verifies the entire Evidence Ledger hash chain.
 * Throws an error if any tampering is detected.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data: events, error } = await supabaseServer
      .from("facttic_governance_events")
      .select("*")
      .eq('org_id', orgId)
      .order("timestamp", { ascending: true });

    if (error) {
      logger.error('LEDGER_READ_FAILED', { orgId, error: error.message });
      return NextResponse.json({ error: 'Failed to read ledger' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ verified: true, events_checked: 0 });
    }

    let previousHash = 'GENESIS_HASH';

    for (const event of events) {
      // Recompute the hash exactly as done during insertion
      const hashInput = 
        event.session_id +
        event.timestamp +
        (event.prompt || '') +
        event.decision +
        event.risk_score +
        JSON.stringify(event.violations || []) +
        previousHash;

      const computedHash = createHash('sha256').update(hashInput).digest('hex');

      if (computedHash !== event.event_hash) {
        logger.error('LEDGER_TAMPER_DETECTED', { 
          orgId, 
          eventId: event.id,
          expectedHash: event.event_hash,
          computedHash 
        });
        return NextResponse.json({ 
          verified: false, 
          error: 'LEDGER_TAMPER_DETECTED',
          message: `Cryptographic mismatch found at event ${event.id}` 
        }, { status: 400 });
      }

      previousHash = event.event_hash;
    }

    logger.info('LEDGER_VERIFIED_SUCCESS', { orgId, events_checked: events.length });

    return NextResponse.json({
      verified: true,
      events_checked: events.length
    });

  } catch (error: any) {
    logger.error('LEDGER_VERIFICATION_ERROR', { orgId, error: error.message });
    return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
  }
});
