import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

/**
 * Supabase Auth Webhook Interceptor for Enterprise SSO Role Mapping
 * 
 * Triggered on `auth.users` events (INSERT/UPDATE). Maps IdP groups/roles
 * (from Azure AD / Okta claims via mapping dicts) into internal Facttic
 * RBAC policies stored in `public.profiles`.
 */
export async function POST(req: Request) {
  try {
    // 1. Verify Webhook Signature here (Assuming API gateway or direct Supabase Secret validation)
    const secret = req.headers.get('x-supabase-webhook-secret');
    if (secret !== process.env.SUPABASE_AUTH_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized Edge Hook' }, { status: 401 });
    }

    const payload = await req.json();
    const { record, type } = payload;

    if (!record || !record.id) {
       return NextResponse.json({ error: 'Invalid User Record' }, { status: 400 });
    }

    // 2. Identify SSO Claims & Providers
    const appMetadata = record.app_metadata || {};
    const userMetadata = record.user_metadata || {};
    
    // Default mapping fallback (Waitlist / Self-serve) vs SSO (Managed)
    const isSsoUser = appMetadata.provider === 'saml' || appMetadata.providers?.includes('sso');
    
    if (isSsoUser) {
      console.log(`[SSO Auth Webhook] Intercepting Enterprise User ID: ${record.id}`);
      
      // Determine Org context from SSO bindings
      // (SSO assertions inject `organization_id` if natively mapped or via claims)
      const mappedOrgId = userMetadata.organization_id || appMetadata.sso_org_id;

      let rbacRole = 'member'; // Fallback
      
      // Map Okta/Azure AD 'groups' or 'roles' claims to Facttic boundaries
      const externalGroups = userMetadata.groups || appMetadata.custom_claims?.roles || [];
      if (Array.isArray(externalGroups)) {
        if (externalGroups.includes('Facttic_Admins') || externalGroups.includes('Global_Access')) {
           rbacRole = 'admin';
        } else if (externalGroups.includes('Facttic_Auditors')) {
           rbacRole = 'auditor';
        }
      }

      // 3. Persist the mapping into the internal RBAC Table
      const { error: profileError } = await supabaseServer
        .from('profiles')
        .upsert({
          id: record.id,
          org_id: mappedOrgId, // Bind tenant boundary physically
          role: rbacRole,
          email: record.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
         console.error('[SSO Auth Webhook] RBAC Profile sync failed:', profileError);
         return NextResponse.json({ error: 'Database Sync Failure' }, { status: 500 });
      }

      console.log(`[SSO Auth Webhook] Successfully mapped ${record.id} to role: ${rbacRole} for Org ${mappedOrgId}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[SSO Auth Webhook] Internal exception:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
