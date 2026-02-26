import { NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabaseAuth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { supabaseServer } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import { ExecutiveStateSchema } from '@/core/contracts/executive.schema'

/**
 * API: /api/governance/executive-state
 *
 * VERSION: 1.0.0 – HARDENED
 * - Session enforced
 * - Org isolation enforced
 * - RPC derived state
 * - Runtime schema validation
 * - Integrity guard
 */

export async function GET() {
  try {
    // 1️⃣ Create Authenticated Supabase Client
    const supabase = await createServerAuthClient()

    const {
      data: { session },
      error: authError
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2️⃣ Resolve Org Context Securely
    const userId = session.user.id
    const ctx = await resolveOrgContext(userId)
    const orgId = ctx?.org_id

    if (!orgId) {
      return NextResponse.json(
        { error: 'ORG_CONTEXT_MISSING' },
        { status: 400 }
      )
    }

    // 3️⃣ Call Frozen RPC
    const { data: state, error: rpcError } =
      await supabaseServer.rpc('compute_executive_state', {
        p_org_id: orgId
      })

    if (rpcError) {
      logger.error('EXECUTIVE_STATE_RPC_FAILED', {
        orgId,
        error: rpcError
      })

      return NextResponse.json(
        { error: 'EXECUTIVE_STATE_RPC_FAILED' },
        { status: 500 }
      )
    }

    if (!state) {
      return NextResponse.json(
        { error: 'EMPTY_STATE_RETURNED' },
        { status: 500 }
      )
    }

    // 4️⃣ Runtime Validation
    const parsed = ExecutiveStateSchema.safeParse(state)

    if (!parsed.success) {
      logger.error('EXECUTIVE_STATE_SCHEMA_INVALID', {
        orgId,
        issues: parsed.error.issues
      })

      return NextResponse.json(
        { error: 'STATE_SCHEMA_INVALID' },
        { status: 500 }
      )
    }

    // 5️⃣ Integrity Guard
    if (!parsed.data.integrity_ok) {
      logger.warn('EXECUTIVE_STATE_INTEGRITY_WARNING', {
        orgId
      })
    }

    return NextResponse.json({
  version: '1.0.0',
  contract: 'EXECUTIVE_STATE_V1',
  success: true,
  data: parsed.data
})

  } catch (error: any) {
    logger.error('EXECUTIVE_STATE_FATAL_ERROR', {
      message: error?.message
    })

    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
}