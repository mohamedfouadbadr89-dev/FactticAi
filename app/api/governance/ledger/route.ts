import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { GovernanceLedger } from '@/lib/security/governanceLedger';

export async function GET(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Verify user owns the org associated 
    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden. No associated root org.' }, { status: 403 });
    }

    // Execute Builder Sequence 
    const timeline = await GovernanceLedger.rebuildChain(orgMember.org_id);

    return NextResponse.json({ timeline }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
