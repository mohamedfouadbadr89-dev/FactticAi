import { supabaseServer } from './supabaseServer'
import { logger } from './logger'
import { TurnRiskScore } from './riskScoringEngine'

export type PersistedTurnRiskScore = TurnRiskScore & {
  signature: string
}

export class EvaluationRepository {
  static async persist(
    orgId: string,
    interactionId: string,
    score: PersistedTurnRiskScore
  ) {
    try {
      const { error } = await supabaseServer
        .from('evaluations')
        .insert({
          org_id: orgId,
          interaction_id: interactionId,
          total_risk: score.total_risk,
          factors: score.factors,
          confidence: score.confidence,
          created_at: score.timestamp,
          signature: score.signature,
        })

      if (error) {
        console.error('EVALUATION_PERSIST_SUPABASE_ERROR:', error)
        throw error
      }
    } catch (err: any) {
      console.error('EVALUATION_PERSIST_FULL_ERROR:', err)
      logger.error('EVALUATION_PERSIST_FAILED', {
        message: err?.message,
        details: err,
      })
      throw err
    }
  }
}