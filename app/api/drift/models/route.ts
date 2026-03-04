import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ModelDriftEngine } from '@/lib/intelligence/modelDriftEngine'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: orgMember, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (error || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url     = new URL(req.url)
    const seed    = url.searchParams.get('seed') === 'true'

    if (seed) {
      await ModelDriftEngine.seedDemoData(orgMember.org_id)
    }

    const reports = await ModelDriftEngine.computeDriftReports(orgMember.org_id)
    return NextResponse.json({ reports })
  } catch (err: any) {
    console.error('[Drift API]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
