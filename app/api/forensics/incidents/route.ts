import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { IncidentService } from '@/lib/forensics/incidentService';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
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
});
