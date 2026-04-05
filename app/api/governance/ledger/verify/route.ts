import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { GovernanceLedger } from '@/lib/security/governanceLedger';

export async function GET(req: NextRequest) {
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
    const verification = await GovernanceLedger.verifyIntegrity(verifiedOrgId);

    return NextResponse.json({ verification }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
