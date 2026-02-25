import { createHash } from 'crypto'
import { TurnRiskScore } from './riskScoringEngine'

export class IntegrityService {
  private static readonly SECRET =
    process.env.GOVERNANCE_SECRET || 'live_risk_default_secret_v1'

  static sign(
    orgId: string,
    interactionId: string,
    score: TurnRiskScore
  ): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          ...score,
          orgId,
          interactionId,
        }) + this.SECRET
      )
      .digest('hex')
  }
}