export interface RiskFactor {
  type: 'hallucination' | 'boundary' | 'tone'
  weight: number
}

export interface TurnRiskScore {
  total_risk: number
  factors: RiskFactor[]
  confidence: string
  timestamp: string
}

export class RiskScoringEngine {
  static evaluateTurn(
    orgId: string,
    interactionId: string,
    payload: any
  ): TurnRiskScore {
    if (!orgId || !interactionId || !payload) {
      throw new Error('SCORING_CONTEXT_MISSING')
    }

    const factors: RiskFactor[] = []

    if (payload?.metadata?.hallucination_detected) {
      factors.push({ type: 'hallucination', weight: 0.32 })
    }

    if (payload?.metadata?.boundary_warning) {
      factors.push({ type: 'boundary', weight: 0.21 })
    }

    if (payload?.metadata?.tone_variance) {
      factors.push({ type: 'tone', weight: 0.11 })
    }

    if (factors.length === 0) {
      factors.push({ type: 'hallucination', weight: 0.02 })
      factors.push({ type: 'boundary', weight: 0.01 })
      factors.push({ type: 'tone', weight: 0.01 })
    }

    const totalRisk = Math.min(
      factors.reduce((acc, f) => acc + f.weight, 0),
      1.0
    )

    return {
      total_risk: parseFloat(totalRisk.toFixed(4)),
      factors,
      confidence: 'DETERMINISTIC',
      timestamp: new Date().toISOString(),
    }
  }
}