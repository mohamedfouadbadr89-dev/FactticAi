import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabaseAuth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { RiskScoringEngine } from '@/lib/riskScoringEngine'
import { EvaluationRepository } from '@/lib/evaluationRepository'
import { IntegrityService } from '@/lib/integrityService'
import { isFeatureEnabled } from '@/config/featureFlags'
import Redis from 'ioredis'
import { signalBus } from '@/lib/signalBus'
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

    const { interaction_id, payload } = body

    if (!interaction_id || !payload) {
      return NextResponse.json(
        { error: 'Missing interaction_id or payload' },
        { status: 400 }
      )
    }

    // 1️⃣ Compute
    const evaluation = RiskScoringEngine.evaluateTurn(
      orgId,
      interaction_id,
      payload
    )

    // 2️⃣ Sign
    const signature = IntegrityService.sign(
      orgId,
      interaction_id,
      evaluation
    )

    const evaluationWithSignature = {
      ...evaluation,
      signature,
    }

    logger.info('TURN_EVALUATED', { orgId, interaction_id })

    // 3️⃣ Persist
    await EvaluationRepository.persist(
      orgId,
      interaction_id,
      evaluationWithSignature
    )

    // 4️⃣ Broadcast
    const channel = `risk_stream:${orgId}`
    const message = JSON.stringify({
      type: 'TURN_RISK_UPDATE',
      interaction_id,
      ...evaluationWithSignature,
    })

    if (
      isFeatureEnabled('REDIS_CACHE_LAYER') &&
      process.env.REDIS_URL
    ) {
      try {
        const redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 0,
          connectTimeout: 1000,
          retryStrategy: () => null,
        })

        await redis.publish(channel, message)
        redis.disconnect()
      } catch {
        signalBus.emit(channel, message)
      }
    } else {
      signalBus.emit(channel, message)
    }

    return NextResponse.json({
      success: true,
      data: evaluationWithSignature,
    })
  } catch (error: any) {
    logger.error('EVALUATION_API_ERROR', {
      error: error?.message,
    })

    return NextResponse.json(
      { error: 'Evaluation failed' },
      { status: 500 }
    )
  }
}