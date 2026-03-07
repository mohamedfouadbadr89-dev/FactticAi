import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { BehaviorAnalyzer } from '@/lib/forensics/behaviorAnalyzer'
import { z } from 'zod'

const ForensicsAnalysisSchema = z.object({
  session_id: z.string().uuid()
})

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

    const json = await req.json()
    const result = ForensicsAnalysisSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 })
    }

    const { session_id } = result.data

    // RBAC Check via Session constraints
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('org_id')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionData) {
        return NextResponse.json({ error: 'Session not found or forbidden.' }, { status: 404 })
    }

    const { data: memberData, error: memberError } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', sessionData.org_id)
      .eq('user_id', session.user.id)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Execute Analysis
    const forensicsResult = await BehaviorAnalyzer.analyzeSession(sessionData.org_id, session_id);

    return NextResponse.json({
      behavior_signals: forensicsResult.behavior_signals,
      risk_scores: forensicsResult.risk_scores
    })
    
  } catch (error: any) {
    console.error('Forensics execution failed:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
