import { supabaseServer } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { authorize, type Role } from '@/lib/rbac';

/**
 * API Org Create
 * 
 * Endpoint to register new organizations.
 * LEVEL 1 Execution.
 */
export const POST = withAuth(async (req: Request, { role }: AuthContext) => {
  try {
    // Only owners can create new organizations
    try {
      authorize(role as Role, 'owner');
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
});
