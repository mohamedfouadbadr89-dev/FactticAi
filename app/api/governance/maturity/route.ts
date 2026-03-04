import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MaturityIndex } from '@/lib/intelligence/maturityIndex'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
            }
        }
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RBAC: Identify primary organization context
    const { data: orgMember, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Execute Analytics Pipeline
    const maturityResult = await MaturityIndex.calculateMaturity(orgMember.org_id);

    return NextResponse.json(maturityResult)
    
  } catch (error: any) {
    console.error('Maturity calculation failed:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
