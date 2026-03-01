import { supabaseServer } from './supabaseServer'
import { logger } from './logger'
import { TurnRiskScore } from './riskTypes'

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
      const { data, error } = await supabaseServer
        .rpc('score_evaluation', {
          p_org_id: orgId,
          p_interaction_id: interactionId,
          p_total_risk: score.total_risk,
          p_factors: score.factors,
          p_confidence: score.confidence,
          p_signature: score.signature,
        })

      if (error) {
        console.error('EVALUATION_PERSIST_SUPABASE_ERROR:', error)
        throw error
      }

      return data as string
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