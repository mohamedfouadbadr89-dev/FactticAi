import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceMetricPayload {
  org_id:               string
  session_id:           string
  latency_ms:           number
  packet_loss:          number   // 0–100 %
  interruptions:        number   // integer count
  audio_integrity_score: number  // 0–100
}

export type StreamQuality = 'good' | 'warning' | 'bad'

export interface VoiceQualityReport {
  session_id:            string
  latency_ms:            number
  packet_loss:           number
  interruptions:         number
  audio_integrity_score: number
  quality:               StreamQuality
  quality_score:         number   // 0–100 composite
  created_at:            string
}

export interface SessionSummary {
  session_id:            string
  avg_latency:           number
  avg_packet_loss:       number
  total_interruptions:   number
  avg_audio_integrity:   number
  overall_quality:       StreamQuality
  overall_score:         number
  snapshot_count:        number
  latest_at:             string
}

// ── Quality classification ─────────────────────────────────────────────────────
// Weights: latency 30%, packet_loss 40%, audio_integrity 30%
// latency penalty: 0 = < 100ms, 50 = 300ms, 100 = > 800ms
// packet_loss penalty: directly maps 0–100
// audio_integrity is inverted (higher = better)

export function computeQualityScore(
  latencyMs: number,
  packetLoss: number,
  audioIntegrity: number
): number {
  const latencyPenalty = Math.min(100, (latencyMs / 800) * 100)
  const lossScore      = Math.min(100, packetLoss)
  const integrityScore = 100 - audioIntegrity  // invert: 100 integrity = 0 penalty

  const composite = latencyPenalty * 0.30 + lossScore * 0.40 + integrityScore * 0.30
  return Math.round(Math.max(0, 100 - composite))
}

export function classifyQuality(score: number): StreamQuality {
  if (score >= 70) return 'good'
  if (score >= 40) return 'warning'
  return 'bad'
}

// ── Telemetry Engine ──────────────────────────────────────────────────────────

export class VoiceTelemetryEngine {
  /** Persist a voice metrics snapshot and return the quality report. */
  static async recordMetrics(payload: VoiceMetricPayload): Promise<VoiceQualityReport> {
    const qualityScore = computeQualityScore(
      payload.latency_ms,
      payload.packet_loss,
      payload.audio_integrity_score
    )
    const quality = classifyQuality(qualityScore)
    const now = new Date().toISOString()

    await supabase.from('voice_stream_metrics').insert({
      org_id:               payload.org_id,
      session_id:           payload.session_id,
      latency_ms:           Math.max(0, payload.latency_ms),
      packet_loss:          Math.min(100, Math.max(0, payload.packet_loss)),
      interruptions:        Math.max(0, Math.round(payload.interruptions)),
      audio_integrity_score: Math.min(100, Math.max(0, payload.audio_integrity_score)),
      created_at:           now,
    })

    return {
      session_id:            payload.session_id,
      latency_ms:            payload.latency_ms,
      packet_loss:           payload.packet_loss,
      interruptions:         payload.interruptions,
      audio_integrity_score: payload.audio_integrity_score,
      quality,
      quality_score:         qualityScore,
      created_at:            now,
    }
  }

  /** Retrieve recent snapshots for a session (last 50). */
  static async getSessionTimeline(orgId: string, sessionId: string): Promise<VoiceQualityReport[]> {
    const { data } = await supabase
      .from('voice_stream_metrics')
      .select('*')
      .eq('org_id', orgId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50)

    return (data ?? []).map(r => {
      const score = computeQualityScore(Number(r.latency_ms), Number(r.packet_loss), Number(r.audio_integrity_score))
      return {
        session_id:            r.session_id,
        latency_ms:            Number(r.latency_ms),
        packet_loss:           Number(r.packet_loss),
        interruptions:         Number(r.interruptions),
        audio_integrity_score: Number(r.audio_integrity_score),
        quality:               classifyQuality(score),
        quality_score:         score,
        created_at:            r.created_at,
      }
    })
  }

  /** Aggregate all recent sessions for an org (last 24h). */
  static async getOrgSummary(orgId: string): Promise<SessionSummary[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('voice_stream_metrics')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) return []

    // Group by session_id
    const bySession: Record<string, typeof data> = {}
    for (const row of data) {
      if (!bySession[row.session_id]) bySession[row.session_id] = []
      bySession[row.session_id].push(row)
    }

    const summaries: SessionSummary[] = Object.entries(bySession).map(([sessionId, rows]) => {
      const avg = (key: string) =>
        Math.round((rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length) * 10) / 10
      const totalInterruptions = rows.reduce((s, r) => s + Number(r.interruptions), 0)
      const avgLatency    = avg('latency_ms')
      const avgLoss       = avg('packet_loss')
      const avgIntegrity  = avg('audio_integrity_score')
      const overallScore  = computeQualityScore(avgLatency, avgLoss, avgIntegrity)

      return {
        session_id:          sessionId,
        avg_latency:         avgLatency,
        avg_packet_loss:     avgLoss,
        total_interruptions: totalInterruptions,
        avg_audio_integrity: avgIntegrity,
        overall_quality:     classifyQuality(overallScore),
        overall_score:       overallScore,
        snapshot_count:      rows.length,
        latest_at:           rows[0].created_at,
      }
    })

    // Sort by worst score first
    summaries.sort((a, b) => a.overall_score - b.overall_score)
    return summaries
  }

  /** Seed demo voice metrics for the dashboard. */
  static async seedDemoData(orgId: string): Promise<void> {
    const sessions = ['sess-voice-alpha', 'sess-voice-beta', 'sess-voice-gamma']
    const rows = sessions.flatMap(sessionId =>
      Array.from({ length: 12 }, (_, i) => {
        const t = Date.now() - (12 - i) * 5 * 60 * 1000
        const isDegrading = sessionId === 'sess-voice-gamma' && i > 7
        return {
          org_id:                orgId,
          session_id:            sessionId,
          latency_ms:            isDegrading ? 400 + Math.random() * 400 : 80 + Math.random() * 120,
          packet_loss:           isDegrading ? 15 + Math.random() * 20 : Math.random() * 5,
          interruptions:         isDegrading ? Math.floor(3 + Math.random() * 5) : Math.floor(Math.random() * 2),
          audio_integrity_score: isDegrading ? 40 + Math.random() * 30 : 80 + Math.random() * 20,
          created_at:            new Date(t).toISOString(),
        }
      })
    )
    await supabase.from('voice_stream_metrics').insert(rows)
  }
}
