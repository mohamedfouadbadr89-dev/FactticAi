import { NextRequest } from 'next/server'
import { createServerAuthClient } from '@/lib/supabaseAuth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { Redis } from 'ioredis'
import { signalBus } from '@/lib/signalBus'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    // =====================================
    // 1️⃣ AUTH (Session Only - Safe)
    // =====================================
    const supabase = await createServerAuthClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return new Response('Unauthorized', { status: 401 })
    }

    // =====================================
    // 2️⃣ ORG RESOLUTION
    // =====================================
    let org_id: string | null = null

    try {
      const ctx = await resolveOrgContext(session.user.id)
      org_id = ctx?.org_id ?? null
    } catch (e: any) {
      logger.error('ORG_RESOLUTION_FAILED', { error: e?.message })
      return new Response('Org Context Error', { status: 400 })
    }

    if (!org_id) {
      return new Response('Org Context Missing', { status: 400 })
    }

    const channel = `risk_stream:${org_id}`

    // =====================================
    // 3️⃣ REDIS SAFE INIT (Optional)
    // =====================================
    let redis: Redis | null = null

    try {
      if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 0,
          connectTimeout: 1000,
        })

        redis.on('error', (err) =>
          logger.error('REDIS_RUNTIME_ERROR', { error: err?.message })
        )
      } else {
        logger.warn('REDIS_URL_NOT_DEFINED')
      }
    } catch (e: any) {
      logger.warn('REDIS_INIT_FAILED', { error: e?.message })
      redis = null
    }

    // =====================================
    // 4️⃣ SSE STREAM CONSTRUCTION
    // =====================================
    const stream = new ReadableStream({
      async start(controller) {
        // Initial handshake
        controller.enqueue(
          encoder.encode(
            `event: CONNECTED\ndata: ${JSON.stringify({
              org_id,
              status: 'STREAM_ACTIVE',
            })}\n\n`
          )
        )

        // Redis subscription (if available)
        if (redis) {
          try {
            await redis.subscribe(channel)

            redis.on('message', (chan, message) => {
              if (chan === channel) {
                controller.enqueue(
                  encoder.encode(
                    `event: RISK_UPDATE\ndata: ${message}\n\n`
                  )
                )
              }
            })
          } catch (e: any) {
            logger.error('REDIS_SUBSCRIBE_ERROR', {
              error: e?.message,
            })
          }
        }

        // Fallback SignalBus (always active)
        const onSignal = (message: string) => {
          controller.enqueue(
            encoder.encode(`event: RISK_UPDATE\ndata: ${message}\n\n`)
          )
        }

        signalBus.on(channel, onSignal)

        // Heartbeat
        const heartbeat = setInterval(() => {
          controller.enqueue(
            encoder.encode(`event: HEARTBEAT\ndata: {}\n\n`)
          )
        }, 15000)

        // Cleanup on disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          redis?.quit()
          signalBus.off(channel, onSignal)
          controller.close()
        })
      },

      cancel() {
        redis?.quit()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    logger.error('STREAM_CRITICAL_FAILURE', {
      error: error?.message,
    })

    // Do NOT crash with 500
    return new Response(
      `event: ERROR\ndata: {"message":"Stream init failure"}\n\n`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      }
    )
  }
}