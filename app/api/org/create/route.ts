import { supabaseServer } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/authGuard';
import { resolveOrgContext } from '@/lib/orgResolver';
import { authorize, type Role } from '@/lib/rbac';

/**
 * API Org Create
 * 
 * Endpoint to register new organizations.
 * LEVEL 1 Execution.
 */
export async function POST(req: Request) {
  try {
    // Auth + RBAC — only owners can create new organizations
    const auth = await withAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const orgContext = await resolveOrgContext(auth.user.id);
    try {
      authorize(orgContext.role as Role, 'owner');
    } catch {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('organizations')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
