import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import {
  defaultDeploymentConfig,
  computeComplianceProfile,
  DEPLOYMENT_MODES,
  REGIONS,
  type DeploymentMode,
  type DataResidency,
} from '@/lib/config/deploymentMode'
import { z } from 'zod'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── GET /api/deployment/config ────────────────────────────────────────────────

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: orgMember, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Read persisted config or fall back to defaults
    const { data: record } = await serviceSupabase
      .from('deployment_configs')
      .select('mode, region, data_residency')
      .eq('org_id', orgMember.org_id)
      .single()

    const config = record ?? defaultDeploymentConfig()
    const compliance = computeComplianceProfile(
      config.mode as DeploymentMode,
      config.data_residency as DataResidency
    )
    const regionMeta = REGIONS.find(r => r.value === config.region)
    const modeMeta   = DEPLOYMENT_MODES[config.mode as DeploymentMode]

    return NextResponse.json({
      mode:               config.mode,
      region:             config.region,
      region_label:       regionMeta?.label ?? config.region,
      data_residency:     config.data_residency,
      compliance_profile: compliance,
      mode_description:   modeMeta?.description ?? '',
      mode_features:      modeMeta?.features ?? [],
    })
  } catch (err: any) {
    console.error('[Deployment Config GET]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ── POST /api/deployment/config ───────────────────────────────────────────────

const UpdateSchema = z.object({
  mode:           z.enum(['SAAS', 'VPC', 'SELF_HOSTED']),
  region:         z.string().min(1),
  data_residency: z.enum(['US', 'EU', 'APAC', 'CUSTOM']),
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

    const { data: orgMember, error: rbacError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Admin role required to change deployment mode' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { mode, region, data_residency } = parsed.data

    // Upsert deployment config
    const { error: upsertError } = await serviceSupabase
      .from('deployment_configs')
      .upsert({
        org_id:         orgMember.org_id,
        mode,
        region,
        data_residency,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'org_id' })

    if (upsertError) throw upsertError

    const compliance = computeComplianceProfile(mode, data_residency)

    return NextResponse.json({ success: true, mode, region, data_residency, compliance_profile: compliance })
  } catch (err: any) {
    console.error('[Deployment Config POST]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
