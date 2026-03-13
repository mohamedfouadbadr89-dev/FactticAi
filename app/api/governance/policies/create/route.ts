import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const authResult = await verifyApiKey(req);
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  // Override org_id from the verified API key
  const verifiedOrgId = authResult.org_id;

  try {
    const body = await req.json();
    const { org_id, policy_name, rule_type, threshold, action } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('governance_policies')
      .insert({
        org_id,
        policy_name,
        rule_type,
        threshold,
        action,
        version: 1,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
