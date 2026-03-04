import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReviewEngine } from '@/lib/review/reviewEngine'
import { z } from 'zod'

const AssignSchema = z.object({
  review_id:   z.string().uuid(),
  assigned_to: z.string().uuid(),
})

export async function POST(req: Request) {
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
      .select('org_id, role')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()
    if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!['owner', 'admin', 'analyst'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Analyst role required' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = AssignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const item = await ReviewEngine.assignReview(
      orgMember.org_id,
      parsed.data.review_id,
      parsed.data.assigned_to
    )

    return NextResponse.json({ success: true, item })
  } catch (err: any) {
    console.error('[Review Assign POST]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
