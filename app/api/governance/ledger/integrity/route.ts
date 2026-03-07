import { verifyApiKey } from '@/lib/security/verifyApiKey';
/**
 * GET /api/governance/ledger/integrity
 *
 * Cryptographic integrity verification for the Facttic Evidence Ledger.
 *
 * Two verification modes:
 *
 *   ?session_id=<uuid>
 *     Full chain walk for every event in the session.
 *     Runs three checks per event: chain linkage, SHA-256 replay, HMAC signature.
 *     Returns a LedgerIntegrityResult with the exact broken event and tamper type.
 *
 *   ?event_id=<uuid>
 *     Point-in-time replay validation for a single event.
 *     Useful for incident review without walking the full chain.
 *     Returns hash_valid, signature_valid, and the stored vs recomputed hash.
 *
 * Both modes require the caller to belong to an org (RBAC check via org_members).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyLedgerIntegrity, EvidenceLedger } from '@/lib/evidence/evidenceLedger'

export async function GET(req: NextRequest) {
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
    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── RBAC — resolve caller's org ───────────────────────────────────────────
    const { data: orgMember, error: rbacError } = await supabaseServer
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (rbacError || !orgMember) {
      return NextResponse.json(
        { error: 'Forbidden. No associated organisation.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const session_id = searchParams.get('session_id')
    const event_id   = searchParams.get('event_id')

    if (!session_id && !event_id) {
      return NextResponse.json(
        { error: 'Provide either session_id or event_id as a query parameter.' },
        { status: 400 }
      )
    }

    // ── Mode 1: Full session chain verification ───────────────────────────────
    if (session_id) {
      const result = await verifyLedgerIntegrity(session_id, orgMember.org_id)

      const status =
        result.integrity_status === 'VALID'
          ? 200
          : result.integrity_status === 'FETCH_ERROR'
          ? 502
          : result.integrity_status === 'EMPTY_SESSION'
          ? 404
          : 200 // non-VALID failures still return 200 with the failure payload

      return NextResponse.json(result, { status })
    }

    // ── Mode 2: Single-event replay validation ────────────────────────────────
    if (event_id) {
      const result = await EvidenceLedger.replayValidation(event_id)

      if (!result) {
        return NextResponse.json(
          { error: `Event ${event_id} not found in the ledger.` },
          { status: 404 }
        )
      }

      return NextResponse.json(result, { status: 200 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
