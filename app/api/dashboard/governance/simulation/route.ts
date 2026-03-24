import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { withAuth, AuthContext } from '@/lib/middleware/auth';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from('simulation_runs')
      .select('*')
      .eq('org_id', orgId)
      .gte('executed_at', oneHourAgo)
      .order('executed_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      count: data.length,
      runs: data 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
