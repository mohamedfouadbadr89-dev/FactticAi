import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/config/featureFlags';
import { supabaseServer } from '@/lib/supabaseServer';
import { PilotManager } from '@/lib/pilotManager';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { authorize, type Role } from '@/lib/rbac';

/**
 * Internal API: /api/internal/demo-provision
 * 
 * Logic to auto-provision a sandbox org for sales demos and Enterprise pilots.
 * TRACEABILITY: Tier 3 Market Activation (v3.3)
 */
export async function POST(req: Request) {
  try {
    // 1. Auth + RBAC — admin or owner only
    const auth = await withAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const orgContext = await resolveOrgContext(auth.user.id);
    try {
      authorize(orgContext.role as Role, 'admin');
    } catch {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // 2. Feature Flag Guard
    if (!isFeatureEnabled('DEMO_AUTO_PROVISION_ENABLED')) {
      return NextResponse.json({ error: "Demo provisioning disabled" }, { status: 403 });
    }

    const { org_name, admin_email } = await req.json();

    if (!org_name || !admin_email) {
      return NextResponse.json({ error: "Missing org_name or admin_email" }, { status: 400 });
    }

    // 2. Create Organization
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .insert({
        name: `${org_name} (DEMO)`,
        slug: `demo-${Date.now()}`
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 3. Activate 14-day Pilot Logic
    await PilotManager.activatePilot(org.id);

    // 4. Record Audit Log
    await supabaseServer.from('audit_logs').insert({
      org_id: org.id,
      action: 'DEMO_ORG_PROVISIONED',
      metadata: { admin_email, tier: 'ENTERPRISE_PILOT' }
    });

    return NextResponse.json({
      success: true,
      org_id: org.id,
      message: "Enterprise Demo Org provisioned with 14-day active pilot."
    });

  } catch (error: any) {
    logger.error('Demo provisioning failed', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
