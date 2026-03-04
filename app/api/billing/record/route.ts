import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { recordBillingEvent } from '@/lib/billingResolver';
import { authorize, type Role } from '@/lib/rbac';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

/**
 * API: /api/billing/record
 * 
 * Secure billing ingestion endpoint.
 */
export const POST = withAuth(async (req: Request, { orgId, role }: AuthContext) => {
  try {
    // Billing requires at minimum 'analyst' role
    try {
      authorize(role as Role, 'analyst');
    } catch {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const { type, units, metadata } = body;

    if (!type || units === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, units" },
        { status: 400 }
      );
    }

    if (units > 100) {
      logger.warn('Billing anomaly detected: High EU spike', { orgId, units });
      Sentry.captureMessage(`Billing anomaly EU spike: ${units} units for org ${orgId}`, 'warning');
    }

    const result = await recordBillingEvent(orgId, type, units, metadata);

    return NextResponse.json({
      success: true,
      data: result,
      message: "BILLING EVENT RECORDED DETERMINISTICALLY"
    });

  } catch (error: any) {
    const status = error.message === 'QUOTA_EXCEEDED' ? 402 : 500;
    const message = error.message === 'QUOTA_EXCEEDED' 
      ? "Organization quota exceeded (402 Payment Required)" 
      : error.message || 'Billing recording failed';

    return NextResponse.json({ error: message }, { status });
  }
});
