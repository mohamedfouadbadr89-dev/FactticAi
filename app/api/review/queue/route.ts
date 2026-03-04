import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReviewEngine, type ReviewStatus } from '@/lib/review/reviewEngine'

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

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()
    if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url    = new URL(req.url)
    const status = url.searchParams.get('status') as ReviewStatus | null
    const seed   = url.searchParams.get('seed') === 'true'

    if (seed) await ReviewEngine.seedDemoQueue(orgMember.org_id)

    const [items, stats] = await Promise.all([
      ReviewEngine.getQueue(orgMember.org_id, status ?? undefined),
      ReviewEngine.getStats(orgMember.org_id),
    ])

    return NextResponse.json({ items, stats })
  } catch (err: any) {
    console.error('[Review Queue GET]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
