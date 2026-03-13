import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GovernanceInterceptor } from '@/lib/governance/interceptor'
import { verifyApiKey } from '@/lib/security/verifyApiKey'

export async function GET(req: Request) {
  try {
    const authResult = await verifyApiKey(req);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const verifiedOrgId = authResult.org_id;
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: orgMember, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (error || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const events = await GovernanceInterceptor.getRecentEvents(orgMember.org_id)
    return NextResponse.json({ events })
  } catch (err: any) {
    console.error('[Intercepts Feed API]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
