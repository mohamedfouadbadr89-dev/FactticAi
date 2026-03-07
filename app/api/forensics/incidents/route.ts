import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { IncidentService } from '@/lib/forensics/incidentService';
import { logger } from '@/lib/logger';

/**
 * Forensic Incidents API
 * 
 * Returns grouped incident threads from the governance_event_ledger.
 */
export async function GET(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const incidents = await IncidentService.getIncidents(orgId);

    return NextResponse.json({
      incidents,
      count: incidents.length,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    logger.error('INCIDENT_FETCH_FAILURE', { orgId, error: err.message });
    return NextResponse.json({ error: 'Internal Forensic Failure' }, { status: 500 });
  }
}
