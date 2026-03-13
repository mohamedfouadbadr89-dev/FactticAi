import { NextResponse } from 'next/server'
import { EvidenceBuilder } from '@/lib/evidence/evidenceBuilder'
import { auditLog } from '@/lib/security/auditLogger'
import { checkRateLimit, rateLimitedResponse } from '@/lib/security/rateLimiter'

export async function POST(req: Request) {
  try {
    // Rate limiting — evidence generation capped at 10 req/min
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(ip, '/api/evidence/generate')
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs)

    // Parse Body
    const body = await req.json()
    const { org_id, timeframe_start, timeframe_end, report_type } = body
    
    if (!org_id || !timeframe_start || !timeframe_end || !report_type) {
        return NextResponse.json({ error: 'Missing required evidence bounds [org_id, timeframe_start, timeframe_end, report_type]' }, { status: 400 })
    }

    // Only Admins or Auditors should generate massive immutable packages ideally, but leaving open for MVP bound checks
    // if (!['owner', 'admin', 'auditor'].includes(membership.role)) {
    //  return NextResponse.json({ error: 'Forbidden: Insufficient Security Execution Clearance' }, { status: 403 })
    // }

    // Execute Evidence Extraction Engine
    const auditPackage = await EvidenceBuilder.generatePackage({
        org_id,
        timeframe_start,
        timeframe_end,
        report_type
    })

    // Audit trail
    await auditLog({
      org_id:   org_id,
      actor_id: null,
      action:   'evidence.generate',
      resource: '/api/evidence/generate',
      status:   'success',
    })

    return NextResponse.json(auditPackage, { status: 201 })

  } catch (error: any) {
    console.error('Evidence Engine Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
