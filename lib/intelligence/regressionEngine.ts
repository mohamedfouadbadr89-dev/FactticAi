import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface RegressionSignal {
  id?: string;
  org_id: string;
  model_version: string;
  signal_type: 'hallucination_rate' | 'tone_shift' | 'confidence_drop' | 'instruction_following_failure';
  baseline_value: number;
  current_value: number;
  delta: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
}

export class RegressionEngine {
  
  /**
   * Deterministic statistical comparison between baseline window and current telemetry mapping.
   */
  static async executeRegressionScan(orgId: string, modelVersion: string, timeframeHours: number = 24): Promise<{ signals: RegressionSignal[], driftMagnitude: number, topSeverity: string }> {
    logger.info('REGRESSION_SCAN_STARTED', { orgId, modelVersion, timeframeHours });

    const currentStart = new Date(Date.now() - timeframeHours * 3600 * 1000).toISOString();
    const baselineStart = new Date(Date.now() - (timeframeHours * 2) * 3600 * 1000).toISOString();
    
    // Read-only SQL Aggregate bounding current window
    const { data: currentEvals, error: errC } = await supabaseServer
      .from('evaluations')
      .select('factors, context_drift')
      .eq('org_id', orgId)
      .eq('model_version', modelVersion)
      .gte('created_at', currentStart);

    // Read-only SQL Aggregate bounding historical baseline
    const { data: baselineEvals, error: errB } = await supabaseServer
      .from('evaluations')
      .select('factors, context_drift')
      .eq('org_id', orgId)
      .eq('model_version', modelVersion)
      .gte('created_at', baselineStart)
      .lt('created_at', currentStart);

    if (errC || errB) {
      logger.error('REGRESSION_FETCH_ERROR', { error: errC || errB });
      throw new Error('Failed to fetch evaluation bounds for regression analysis.');
    }

    if (!currentEvals || currentEvals.length === 0 || !baselineEvals || baselineEvals.length === 0) {
      return { signals: [], driftMagnitude: 0, topSeverity: 'low' };
    }

    // Averages extraction
    const extractAverages = (evals: any[]) => {
      let halSum = 0, toneSum = 0, confSum = 0, instSum = 0;
      evals.forEach(e => {
        const f = typeof e.factors === 'string' ? JSON.parse(e.factors) : (e.factors || {});
        halSum += f.hallucination || 0;
        toneSum += f.tone_risk || 0;
        confSum += f.response_confidence || 0; // note: response_confidence is actually uncertainty in our model (high = bad)
        instSum += f.context_drift || e.context_drift || 0;
      });
      return {
        hallucinationAvg: halSum / evals.length,
        toneAvg: toneSum / evals.length,
        confidenceAvg: confSum / evals.length,
        instructionAvg: instSum / evals.length
      };
    };

    const currentMetrics = extractAverages(currentEvals);
    const baselineMetrics = extractAverages(baselineEvals);

    const signals: RegressionSignal[] = [];
    const timestamp = new Date().toISOString();

    const evaluateSignal = (type: RegressionSignal['signal_type'], current: number, baseline: number) => {
      const delta = current - baseline;
      // If degradation exceeds strict deterministic limits (+0.1 risk scale drift across a window)
      if (delta > 0.05) { 
        const severity = delta > 0.3 ? 'critical' : delta > 0.15 ? 'high' : delta > 0.1 ? 'medium' : 'low';
        signals.push({
          org_id: orgId,
          model_version: modelVersion,
          signal_type: type,
          baseline_value: Number(baseline.toFixed(4)),
          current_value: Number(current.toFixed(4)),
          delta: Number(delta.toFixed(4)),
          severity,
          detected_at: timestamp
        });
      }
    };

    evaluateSignal('hallucination_rate', currentMetrics.hallucinationAvg, baselineMetrics.hallucinationAvg);
    evaluateSignal('tone_shift', currentMetrics.toneAvg, baselineMetrics.toneAvg);
    evaluateSignal('confidence_drop', currentMetrics.confidenceAvg, baselineMetrics.confidenceAvg);
    evaluateSignal('instruction_following_failure', currentMetrics.instructionAvg, baselineMetrics.instructionAvg);

    // Persist mapped deltas
    if (signals.length > 0) {
      const { error: insertError } = await supabaseServer
        .from('regression_signals')
        .insert(signals);
      
      if (insertError) {
        logger.error('REGRESSION_SYNC_ERROR', { error: insertError });
      }
    }

    const driftMagnitude = signals.reduce((sum, s) => sum + s.delta, 0);
    const topSeverity = signals.find(s => s.severity === 'critical') ? 'critical' : 
                        signals.find(s => s.severity === 'high') ? 'high' : 
                        signals.find(s => s.severity === 'medium') ? 'medium' : 'low';

    return { signals, driftMagnitude, topSeverity };
  }
}
