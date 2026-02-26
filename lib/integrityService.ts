import crypto from 'crypto'
import { TurnRiskScore } from './riskTypes'

const SECRET = process.env.GOVERNANCE_SIGNING_SECRET || 'dev-secret'

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`
  }

  const keys = Object.keys(obj).sort()

  return `{${keys
    .map(key => `"${key}":${stableStringify(obj[key])}`)
    .join(',')}}`
}

export class IntegrityService {
  static sign(
    orgId: string,
    interactionId: string,
    score: TurnRiskScore
  ): string {

    const canonicalObject = {
      org_id: orgId,
      interaction_id: interactionId,
      total_risk: Number(score.total_risk),
      confidence: Number(score.confidence),
      timestamp: new Date(score.timestamp).toISOString(),
      factors: score.factors,
    }

    const canonicalString = stableStringify(canonicalObject)

    return crypto
      .createHmac('sha256', SECRET)
      .update(canonicalString)
      .digest('hex')
  }
}