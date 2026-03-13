import { TurnRiskScore } from './riskTypes'

// ─── Weights (must sum to 1.0) ──────────────────────────────────────────────
const WEIGHTS = {
  hallucination:       0.35,
  tone_risk:           0.25,
  context_drift:       0.20,
  response_confidence: 0.20,
} as const

// ─── Tone: aggressive / unsafe / manipulative keywords ──────────────────────
// Sorted alphabetically — order is fixed, evaluation is deterministic.
const UNSAFE_TONE_KEYWORDS: readonly string[] = [
  'attack', 'bomb', 'bypass', 'deceive', 'destroy', 'exploit',
  'fool', 'hack', 'harm', 'hurt', 'ignore instructions',
  'kill', 'lie', 'manipulate', 'override', 'threaten',
  'trick', 'violence', 'weapon',
]

// ─── Confidence: uncertainty signal phrases ──────────────────────────────────
// Each phrase signals the model is unsure — higher count = higher risk.
const UNCERTAINTY_MARKERS: readonly string[] = [
  'approximately', 'could be', 'i believe', 'i guess',
  "i'm not sure", "i'm unsure", 'i think', 'maybe',
  'might be', 'not certain', 'possibly', 'probably',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clamp a value to [0, 1]. */
function clamp(v: number): number {
  return Math.min(Math.max(v, 0), 1)
}

/** Round to 4 decimal places for stable deterministic output. */
function r4(v: number): number {
  return Math.round(v * 10_000) / 10_000
}

/**
 * Deterministic tone-risk score derived from raw text content.
 * Each matched keyword adds 0.2, capped at 1.0.
 * Pure function — no randomness, no I/O.
 */
function scoreToneFromContent(text: string): number {
  if (!text) return 0
  const lower = text.toLowerCase()
  let hits = 0
  for (const kw of UNSAFE_TONE_KEYWORDS) {
    if (lower.includes(kw)) hits++
  }
  return clamp(hits * 0.2)
}

/**
 * Deterministic confidence-risk score derived from raw text content.
 * Each matched uncertainty phrase adds 0.15, capped at 1.0.
 * Pure function — no randomness, no I/O.
 */
function scoreUncertaintyFromContent(text: string): number {
  if (!text) return 0
  const lower = text.toLowerCase()
  let hits = 0
  for (const phrase of UNCERTAINTY_MARKERS) {
    if (lower.includes(phrase)) hits++
  }
  return clamp(hits * 0.15)
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export class RiskScoringEngine {
  /**
   * Evaluate a single AI interaction turn and return a deterministic risk score.
   *
   * Input priority for each factor:
   *   1. Explicit numeric value in payload.metadata  (0.0 – 1.0, authoritative)
   *   2. Boolean flag in payload.metadata            (maps to 0.0 or 1.0)
   *   3. Derived from payload.content via keyword analysis (pure function)
   *   4. Default: 0.0 (safest assumption)
   *
   * Determinism guarantee: for identical payload values all numeric outputs
   * are identical. The timestamp field records when the evaluation ran and
   * is intentionally non-deterministic (point-in-time event metadata).
   */
  static evaluateTurn(
    _orgId: string,
    _interactionId: string,
    payload: any
  ): TurnRiskScore {
    const meta: Record<string, any> = payload?.metadata ?? {}
    const content: string = payload?.content ?? meta?.content ?? ''

    // ── Factor 1: hallucination (weight 0.35) ────────────────────────────────
    let hallucination: number
    if (typeof meta.hallucination_score === 'number') {
      hallucination = clamp(meta.hallucination_score)
    } else {
      hallucination = meta.hallucination_detected === true ? 1.0 : 0.0
    }

    // ── Factor 2: tone_risk (weight 0.25) ────────────────────────────────────
    let toneRisk: number
    if (typeof meta.tone_risk === 'number') {
      toneRisk = clamp(meta.tone_risk)
    } else {
      toneRisk = scoreToneFromContent(content)
    }

    // ── Factor 3: context_drift (weight 0.20) ────────────────────────────────
    let contextDrift: number
    if (typeof meta.context_drift === 'number') {
      contextDrift = clamp(meta.context_drift)
    } else if (meta.context_drift_detected === true) {
      contextDrift = 1.0
    } else {
      contextDrift = 0.0
    }

    // ── Factor 4: response_confidence risk (weight 0.20) ─────────────────────
    // Treat as an uncertainty / low-confidence score (0 = certain, 1 = uncertain).
    let confidenceRisk: number
    if (typeof meta.response_confidence === 'number') {
      confidenceRisk = clamp(meta.response_confidence)
    } else {
      confidenceRisk = scoreUncertaintyFromContent(content)
    }

    // ── Weighted sum (deterministic, bounded [0, 1]) ─────────────────────────
    const totalRisk = r4(clamp(
      WEIGHTS.hallucination       * hallucination +
      WEIGHTS.tone_risk           * toneRisk +
      WEIGHTS.context_drift       * contextDrift +
      WEIGHTS.response_confidence * confidenceRisk
    ))

    // ── Overall confidence: inverse of mean factor risk ──────────────────────
    const meanRisk = (hallucination + toneRisk + contextDrift + confidenceRisk) / 4
    const confidence = r4(clamp(1 - meanRisk))

    return {
      total_risk: totalRisk,
      factors: {
        hallucination:       r4(hallucination),
        tone_risk:           r4(toneRisk),
        context_drift:       r4(contextDrift),
        response_confidence: r4(confidenceRisk),
      },
      confidence,
      timestamp: new Date().toISOString(),
    }
  }
}
