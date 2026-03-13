import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'in_review' | 'resolved' | 'escalated' | 'dismissed'

export interface ReviewQueueItem {
  id:              string
  org_id:          string
  session_id:      string
  risk_score:      number
  status:          ReviewStatus
  assigned_to:     string | null
  notes:           string | null
  flagged_reason:  string | null
  created_at:      string
  updated_at:      string
}

export interface QueueStats {
  total:      number
  pending:    number
  in_review:  number
  resolved:   number
  escalated:  number
  dismissed:  number
  avg_risk:   number
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class ReviewEngine {
  /** Add a flagged session to the review queue. Idempotent on session_id. */
  static async flagSession(
    orgId: string,
    sessionId: string,
    riskScore: number,
    flaggedReason?: string
  ): Promise<ReviewQueueItem> {
    // Check for existing entry to avoid duplicates
    const { data: existing } = await supabase
      .from('review_queue')
      .select('*')
      .eq('org_id', orgId)
      .eq('session_id', sessionId)
      .limit(1)
      .single()

    if (existing) return existing as ReviewQueueItem

    const { data, error } = await supabase
      .from('review_queue')
      .insert({
        org_id:         orgId,
        session_id:     sessionId,
        risk_score:     Math.min(100, Math.max(0, riskScore)),
        status:         'pending',
        flagged_reason: flaggedReason ?? 'High risk score detected',
      })
      .select()
      .single()

    if (error) throw error
    return data as ReviewQueueItem
  }

  /** Fetch the review queue for an org, sorted by risk desc. */
  static async getQueue(
    orgId: string,
    status?: ReviewStatus,
    limit = 50
  ): Promise<ReviewQueueItem[]> {
    let query = supabase
      .from('review_queue')
      .select('*')
      .eq('org_id', orgId)
      .order('risk_score', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data } = await query
    return (data ?? []) as ReviewQueueItem[]
  }

  /** Assign a review queue item to a user. */
  static async assignReview(
    orgId: string,
    reviewId: string,
    assignedTo: string
  ): Promise<ReviewQueueItem> {
    const { data, error } = await supabase
      .from('review_queue')
      .update({
        assigned_to: assignedTo,
        status:      'in_review',
        updated_at:  new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data as ReviewQueueItem
  }

  /** Resolve, dismiss, or escalate a review item. */
  static async updateStatus(
    orgId: string,
    reviewId: string,
    status: Exclude<ReviewStatus, 'pending' | 'in_review'>,
    notes?: string
  ): Promise<ReviewQueueItem> {
    const { data, error } = await supabase
      .from('review_queue')
      .update({
        status,
        notes:      notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data as ReviewQueueItem
  }

  /** Get queue statistics for the org. */
  static async getStats(orgId: string): Promise<QueueStats> {
    const { data } = await supabase
      .from('review_queue')
      .select('status, risk_score')
      .eq('org_id', orgId)

    const rows = data ?? []
    const count = (s: ReviewStatus) => rows.filter(r => r.status === s).length
    const avgRisk = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + Number(r.risk_score), 0) / rows.length)
      : 0

    return {
      total:     rows.length,
      pending:   count('pending'),
      in_review: count('in_review'),
      resolved:  count('resolved'),
      escalated: count('escalated'),
      dismissed: count('dismissed'),
      avg_risk:  avgRisk,
    }
  }

  /** Seed demo review queue items. */
  static async seedDemoQueue(orgId: string): Promise<void> {
    const items = [
      { session_id: 'sess-review-001', risk_score: 92, flagged_reason: 'Prompt injection detected by interceptor', status: 'pending' },
      { session_id: 'sess-review-002', risk_score: 78, flagged_reason: 'Hallucination rate exceeded threshold', status: 'in_review' },
      { session_id: 'sess-review-003', risk_score: 65, flagged_reason: 'Policy violation — PII mentioned', status: 'pending' },
      { session_id: 'sess-review-004', risk_score: 88, flagged_reason: 'ESCALATE signal from guardrail engine', status: 'escalated' },
      { session_id: 'sess-review-005', risk_score: 55, flagged_reason: 'Confidence drop exceeded drift threshold', status: 'resolved' },
    ]

    // Skip existing sessions
    const { data: existing } = await supabase
      .from('review_queue')
      .select('session_id')
      .eq('org_id', orgId)

    const existingIds = new Set((existing ?? []).map((r: any) => r.session_id))
    const toInsert = items
      .filter(i => !existingIds.has(i.session_id))
      .map(i => ({ org_id: orgId, ...i }))

    if (toInsert.length > 0) {
      await supabase.from('review_queue').insert(toInsert)
    }
  }
}
