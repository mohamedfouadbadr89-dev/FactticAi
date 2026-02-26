import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabaseAuth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { supabaseServer } from '@/lib/supabaseServer'
import { IntegrityService } from '@/lib/integrityService'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createServerAuthClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { org_id: orgId } = await resolveOrgContext(session.user.id)

    if (!orgId) {
      return NextResponse.json(
        { error: 'ORG_CONTEXT_MISSING' },
        { status: 400 }
      )
    }

    const { interaction_id } = body

    if (!interaction_id) {
      return NextResponse.json(
        { error: 'interaction_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('evaluations')
      .select('*')
      .eq('org_id', orgId)
      .eq('interaction_id', interaction_id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    // 🔐 Rebuild canonical payload EXACTLY like evaluate
    const canonicalPayload = {
      total_risk: Number(data.total_risk),
      factors: data.factors,
      confidence: Number(data.confidence),
      timestamp: new Date(data.created_at).toISOString(),
    }

    const recalculatedSignature = IntegrityService.sign(
      orgId,
      interaction_id,
      canonicalPayload
    )

    const isValid = recalculatedSignature === data.signature

    return NextResponse.json({
      success: true,
      valid: isValid,
      stored_signature: data.signature,
      recalculated_signature: recalculatedSignature,
    })
  } catch (error: any) {
    logger.error('VERIFY_API_ERROR', {
      error: error?.message,
    })

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}