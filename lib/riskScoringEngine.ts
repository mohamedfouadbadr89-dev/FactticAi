import { TurnRiskScore } from './riskTypes'

export class RiskScoringEngine {
  static evaluateTurn(
    orgId: string,
    interactionId: string,
    payload: any
  ): TurnRiskScore {

    const hallucinationDetected =
      payload?.metadata?.hallucination_detected === true

    const totalRisk = hallucinationDetected ? 0.8 : 0.2
    const confidence = 0.95

    return {
      total_risk: Number(totalRisk),
      factors: {
        hallucination: hallucinationDetected ? 1 : 0,
      },
      confidence: Number(confidence),
      timestamp: new Date().toISOString(),
    }
  }
}