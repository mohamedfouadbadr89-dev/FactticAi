import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CURRENT_REGION } from '@/config/regions'
import { InstitutionalBenchmarkIndex } from '@/core/governance/institutionalBenchmarkIndex'
import { ExecutiveComplianceSummary } from '@/core/governance/executiveComplianceSummary'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Strategic Risk Projection API (Phase 4 – Predictive Layer)
 */
export async function GET() {
  try {
    // ⚠️ مؤقتًا نحط org ثابت للتست
    const orgId = 'c345de67-f89a-401b-c234-56789012cdef'

    const { data, error } = await supabase
      .rpc('compute_risk_projection', { p_org_id: orgId })

    if (error) {
      console.error('RISK_PROJECTION_RPC_ERROR', error)
      return NextResponse.json(
        { error: 'RISK_PROJECTION_FAILED' },
        { status: 500 }
      )
    }

    const benchmarks = InstitutionalBenchmarkIndex.getBenchmarks()
    const summary = ExecutiveComplianceSummary.generateSummary()

    return NextResponse.json(
      {
        status: 'PREDICTIVE_ACTIVE',
        region: CURRENT_REGION,
        predictive: data,
        benchmarking: benchmarks,
        integritySeal: summary.signature.substring(0, 16)
      },
      {
        headers: {
          'X-Strategic-Projection': 'v7.0',
          'X-Predictive-Layer': 'ENABLED'
        }
      }
    )

  } catch (err) {
    console.error('STRATEGIC_PROJECTION_FATAL', err)
    return NextResponse.json(
      { error: 'STRATEGIC_PROJECTION_UNAVAILABLE' },
      { status: 503 }
    )
  }
}