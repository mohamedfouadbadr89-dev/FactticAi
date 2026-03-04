import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { BenchmarkEngine } from '@/lib/intelligence/benchmarkEngine'

export async function GET(req: Request) {
  try {
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

    // Resolve caller's org
    const { data: orgMember, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const refresh = url.searchParams.get('refresh') === 'true'

    const report = refresh
      ? await BenchmarkEngine.computeBenchmarks(orgMember.org_id)
      : await BenchmarkEngine.getLatestBenchmarks(orgMember.org_id)

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('[Benchmark API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
