import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/org/current
 * Returns the authenticated user's organization profile.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const { data, error } = await supabaseServer
      .from('organizations')
      .select('id, name, slug, created_at')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      // Graceful fallback — org exists (we have orgId) but may lack a record in organizations table
      return NextResponse.json({
        id: orgId,
        name: 'My Organization',
        slug: '',
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
