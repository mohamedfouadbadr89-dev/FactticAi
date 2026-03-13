import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

export interface PredictiveDriftSignal {

  model: string
  drift_score: number
  momentum: number
  predicted_threshold_hours: number
  escalation: 'watch' | 'warning' | 'critical'
}

export class PredictiveDriftEngine {

  private static CRITICAL_THRESHOLD = 80

  static async computePredictiveDriftRisk(
    orgId: string,
    modelName: string
  ): Promise<PredictiveDriftSignal | null> {

    try {

      const { data: metrics } = await supabaseServer
        .from('model_drift_metrics')
        .select('*')
        .eq('org_id', orgId)
        .eq('model_name', modelName)
        .order('recorded_at', { ascending: false })
        .limit(2)

      if (!metrics || metrics.length < 2) {

        logger.info('PREDICTIVE_DRIFT_NO_HISTORY', { modelName })

        return null
      }

      const current = metrics[0]
      const previous = metrics[1]

      const driftNow = Number(current.drift_score)
      const driftPrev = Number(previous.drift_score)

      const timeDelta =
        new Date(current.recorded_at).getTime() -
        new Date(previous.recorded_at).getTime()

      const hours = Math.max(0.1, timeDelta / (1000 * 60 * 60))

      const momentum = (driftNow - driftPrev) / hours

      let predicted = 999

      if (momentum > 0) {

        predicted =
          (this.CRITICAL_THRESHOLD - driftNow) / momentum
      }

      let escalation: 'watch' | 'warning' | 'critical' = 'watch'

      if (predicted < 6 || driftNow >= this.CRITICAL_THRESHOLD)
        escalation = 'critical'
      else if (predicted < 24)
        escalation = 'warning'

      const signal: PredictiveDriftSignal = {
        model: modelName,
        drift_score: driftNow,
        momentum: Math.round(momentum * 1000) / 1000,
        predicted_threshold_hours: Math.round(predicted),
        escalation
      }

      await supabaseServer.from('predictive_drift_events').insert({
        org_id: orgId,
        model_name: modelName,
        drift_score: driftNow,
        risk_momentum: momentum,
        predicted_threshold_hours: predicted,
        status: escalation
      })

      logger.info('PREDICTIVE_DRIFT_SIGNAL', signal)

      return signal

    } catch (err:any) {

      logger.error('PREDICTIVE_DRIFT_FAILED', {
        error: err.message
      })

      return null
    }
  }
}