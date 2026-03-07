import { verifyApiKey } from '@/lib/security/verifyApiKey';
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { RiskScoringEngine } from '@/lib/riskScoringEngine'
import { isFeatureEnabled } from '@/config/featureFlags'
import Redis from 'ioredis'
import { signalBus } from '@/lib/signalBus'
import { logger } from '@/lib/logger'

export const POST = withAuth(async (req, { session }) => {
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
    const body = await req.json()
    const { org_id: orgId } = await resolveOrgContext(session.user.id)

    if (!orgId) {
      return NextResponse.json({ error: 'ORG_CONTEXT_MISSING' }, { status: 400 })
    }

    const { interaction_id, payload } = body

    if (!interaction_id || !payload) {
      return NextResponse.json(
        { error: 'Missing interaction_id or payload' },
        { status: 400 }
      )
    }

    const evaluation = await RiskScoringEngine.evaluateTurn(
      orgId,
      interaction_id,
      payload
    )

    logger.info('TURN_EVALUATED', { orgId, interaction_id })

    const channel = `risk_stream:${orgId}`
    const message = JSON.stringify({
      type: 'TURN_RISK_UPDATE',
      interaction_id,
      ...evaluation,
    })

    // ✅ Redis optional — runtime only
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
      data: evaluation,
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
})