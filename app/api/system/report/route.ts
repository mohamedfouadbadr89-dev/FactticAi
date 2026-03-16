import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { GovernancePipeline } from '@/lib/governance/governancePipeline';
import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (req.url.includes('ping=1')) {
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const result: any = {
    system_status: 'ok',
    routes: {},
    database: {},
    tables: {},
    sessions: {},
    incidents: {},
    governance_test: {},
    security: {},
    performance: {}
  };

  const origin = req.headers.get('origin') || `http://${req.headers.get('host') || 'localhost:3000'}`;

  // 1. API ROUTES
  const routesToCheck = [
    '/api/chat',
    '/api/governance/sessions',
    '/api/governance/replay',
    '/api/system/report'
  ];

  for (const route of routesToCheck) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      // We do a lightweight HEAD or GET request to check existence.
      // Some routes might return 400/401/405, but as long as it's not 404, the route exists.
      const requestUrl = route === '/api/system/report' ? `${route}?ping=1` : route;
      const res = await fetch(`${origin}${requestUrl}`, { 
        method: 'HEAD',
        signal: controller.signal
      }).catch(() => fetch(`${origin}${requestUrl}`, { method: 'GET', signal: controller.signal }));
      
      clearTimeout(timeoutId);
      
      result.routes[route] = res && res.status !== 404 ? 'ok' : 'error';
    } catch (e) {
      result.routes[route] = 'error';
    }
  }

  // 2. DATABASE CONNECTION
  try {
    const { error: dbError } = await supabaseServer.from('sessions').select('id').limit(1);
    result.database.database_status = dbError ? 'failed' : 'connected';
  } catch (e) {
    result.database.database_status = 'failed';
  }

  // 3. TABLES CHECK
  const tablesToCheck = [
    'sessions',
    'session_turns',
    'api_keys',
    'agents',
    'organizations',
    'incidents'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabaseServer.from(table).select('id').limit(1);
      result.tables[table] = !error; // If there's an error (e.g., table doesn't exist), it will be false. 
                                     // NOTE: Might also be false if policy blocks, but for a service role key it shouldn't.
    } catch (e) {
      result.tables[table] = false;
    }
  }

  // 4. SESSION DATA HEALTH
  try {
    const { count, error } = await supabaseServer
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    result.sessions.total_sessions = error ? 0 : count || 0;
  } catch (e) {
    result.sessions.total_sessions = 0;
  }

  // 5. INCIDENT DATA HEALTH
  try {
    const { count, error } = await supabaseServer
      .from('incidents')
      .select('*', { count: 'exact', head: true });
    
    result.incidents.total_incidents = error ? 0 : count || 0;
  } catch (e) {
    result.incidents.total_incidents = 0;
  }

  // 6. GOVERNANCE ENGINE & 8. PIPELINE LATENCY
  try {
    const govStartTime = Date.now();
    const govResult = await GovernancePipeline.execute({
      org_id: 'system_diagnostic_test',
      user_id: 'system-diagnostic',  // System-identity principal for health checks
      prompt: 'hello'
    }) as any;
    const govEndTime = Date.now();

    const pipeline_latency_ms = govEndTime - govStartTime;

    result.governance_test = {
      decision: govResult.decision,
      risk_score: govResult.risk_score,
      latency_ms: govResult.latency_ms
    };
    
    result.performance.pipeline_latency_ms = pipeline_latency_ms;
  } catch (e: any) {
    result.governance_test = { error: e.message || 'Governance execution failed' };
    result.performance.pipeline_latency_ms = -1;
  }

  // 7. SECURITY LAYER
  try {
    // Simulate a request without an Authorization header
    const mockRequest = new Request('http://localhost/api/test', {
      headers: new Headers() // Empty headers
    });
    
    const securityCheck = await verifyApiKey(mockRequest);
    
    if (securityCheck && (securityCheck.error === 'Missing Authorization header' || securityCheck.status === 401)) {
      result.security.security_status = 'enforced';
    } else {
      result.security.security_status = 'bypassed';
    }
  } catch (e) {
    result.security.security_status = 'error';
  }

  // DETERMINE OVERALL SYSTEM STATUS
  const hasRouteErrors = Object.values(result.routes).some(status => status === 'error');
  const isDbFailed = result.database.database_status === 'failed';
  const hasTableErrors = Object.values(result.tables).some(status => status === false);
  const isSecurityBypassed = result.security.security_status !== 'enforced';
  const hasGovernanceError = !!result.governance_test.error;

  if (isDbFailed || isSecurityBypassed || hasGovernanceError || hasTableErrors) {
    result.system_status = 'failed';
  } else if (hasRouteErrors) {
    result.system_status = 'degraded';
  }

  return NextResponse.json(result, { status: 200 });
}
