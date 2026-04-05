import { NormalizedMessage } from '@/lib/integrations/voiceIngestion'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BargeInEvent {
  /** Index of the assistant turn that was interrupted */
  turn_index: number
  /** Estimated milliseconds of speech overlap (0 when using heuristic method) */
  estimated_overlap_ms: number
}

export interface BargeInAnalysis {
  detected: boolean
  event_count: number
  /** Fraction of assistant turns that were interrupted (0–1) */
  barge_in_rate: number
  /** Normalized collision severity 0–1, suitable for GovernancePipeline.voice_collision_index */
  collision_index: number
  events: BargeInEvent[]
  /** How the detection was performed */
  method: 'timestamp' | 'heuristic'
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Average words per second for conversational speech (150 wpm) */
const AVG_WPS = 2.5

/** Overlap threshold in ms — gaps shorter than this are considered barge-ins */
const OVERLAP_THRESHOLD_MS = 500

/** Heuristic: assistant turns with fewer words than this are assumed interrupted */
const SHORT_TURN_WORD_THRESHOLD = 8

// ── Helpers ───────────────────────────────────────────────────────────────────

function estimateDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.round((words / AVG_WPS) * 1000)
}

/**
 * Parse provider-specific timestamp formats to milliseconds.
 * - Retell: numeric seconds (e.g. "1.234")
 * - VAPI: numeric ms (e.g. "1710000000000")
 * - ISO strings: parsed via Date.parse
 */
function parseTimestampMs(ts: string | undefined): number | null {
  if (ts == null) return null
  const n = parseFloat(ts)
  if (!isNaN(n)) {
    // Retell provides seconds (small float), VAPI provides unix-ms (large number)
    return n < 1e9 ? Math.round(n * 1000) : Math.round(n)
  }
  const d = Date.parse(ts)
  return isNaN(d) ? null : d
}

// ── Detector ─────────────────────────────────────────────────────────────────

export class BargeInDetector {
  /**
   * Analyze a normalized conversation transcript for barge-in events.
   *
   * When message timestamps are present (e.g. Retell word timings, VAPI call times),
   * the detector estimates speech duration and measures overlap with the next user turn.
   *
   * When timestamps are absent, a heuristic is used: assistant turns with fewer than
   * SHORT_TURN_WORD_THRESHOLD words immediately before a user turn suggest interruption.
   */
  static analyze(messages: NormalizedMessage[]): BargeInAnalysis {
    const assistantTurns = messages.filter(m => m.role === 'assistant')

    if (assistantTurns.length === 0) {
      return { detected: false, event_count: 0, barge_in_rate: 0, collision_index: 0, events: [], method: 'heuristic' }
    }

    const hasTimestamps = messages.some(m => m.timestamp != null)

    return hasTimestamps
      ? BargeInDetector.analyzeWithTimestamps(messages, assistantTurns.length)
      : BargeInDetector.analyzeHeuristic(messages, assistantTurns.length)
  }

  private static analyzeWithTimestamps(
    messages: NormalizedMessage[],
    totalAssistantTurns: number
  ): BargeInAnalysis {
    const events: BargeInEvent[] = []

    for (let i = 0; i < messages.length - 1; i++) {
      const curr = messages[i]
      const next = messages[i + 1]

      if (curr.role !== 'assistant' || next.role !== 'user') continue

      const assistantStart = parseTimestampMs(curr.timestamp)
      const userStart      = parseTimestampMs(next.timestamp)

      if (assistantStart === null || userStart === null) continue

      const estimatedEnd = assistantStart + estimateDurationMs(curr.content)
      const overlap      = estimatedEnd - userStart

      if (overlap > OVERLAP_THRESHOLD_MS) {
        events.push({ turn_index: i, estimated_overlap_ms: overlap })
      }
    }

    return BargeInDetector.buildResult(events, totalAssistantTurns, 'timestamp')
  }

  private static analyzeHeuristic(
    messages: NormalizedMessage[],
    totalAssistantTurns: number
  ): BargeInAnalysis {
    const events: BargeInEvent[] = []

    for (let i = 0; i < messages.length - 1; i++) {
      const curr = messages[i]
      const next = messages[i + 1]

      if (curr.role !== 'assistant' || next.role !== 'user') continue

      const wordCount = curr.content.trim().split(/\s+/).length
      if (wordCount < SHORT_TURN_WORD_THRESHOLD) {
        events.push({ turn_index: i, estimated_overlap_ms: 0 })
      }
    }

    return BargeInDetector.buildResult(events, totalAssistantTurns, 'heuristic')
  }

  private static buildResult(
    events: BargeInEvent[],
    totalAssistantTurns: number,
    method: 'timestamp' | 'heuristic'
  ): BargeInAnalysis {
    const bargeInRate    = events.length / totalAssistantTurns
    // Collision index scales slightly more aggressively for timestamp-based detection
    // (we have higher confidence), but capped at 1
    const scaleFactor    = method === 'timestamp' ? 1.5 : 1.2
    const collisionIndex = Math.min(1, bargeInRate * scaleFactor)

    return {
      detected:        events.length > 0,
      event_count:     events.length,
      barge_in_rate:   Math.round(bargeInRate    * 100) / 100,
      collision_index: Math.round(collisionIndex * 100) / 100,
      events,
      method,
    }
  }
}
