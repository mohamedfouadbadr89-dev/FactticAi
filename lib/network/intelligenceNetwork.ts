import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface GlobalModelReport {
  name: string;
  global_risk_score: number;
  hallucination_frequency: number;
  injection_activity: number;
  sample_size: number;
}

/**
 * Intelligence Network Engine (Phase 53)
 * Aggregates anonymized signals across all organizations to produce global risk intelligence.
 */
export class IntelligenceNetwork {
  /**
   * Accepts and persists an anonymized signal.
   * Upserts based on pattern_hash and model_name to track frequency.
   */
  static async ingestSignal(signal: {
    model_name: string;
    signal_type: string;
    risk_score: number;
    pattern_hash: string;
  }) {
    try {
      const { data: existing, error: fetchError } = await supabaseServer
        .from('global_risk_signals')
        .select('id, frequency')
        .eq('pattern_hash', signal.pattern_hash)
        .eq('model_name', signal.model_name)
        .single();

      if (existing) {
        await supabaseServer
          .from('global_risk_signals')
          .update({
            frequency: existing.frequency + 1,
            last_seen: new Date().toISOString(),
            risk_score: signal.risk_score // Update with latest score
          })
          .eq('id', existing.id);
      } else {
        await supabaseServer
          .from('global_risk_signals')
          .insert({
            ...signal,
            frequency: 1,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });
      }
    } catch (err: any) {
      logger.error('NETWORK_INGESTION_FAILED', { error: err.message, signal });
      throw err;
    }
  }

  /**
   * Generates global reliability reports for all models.
   */
  static async getGlobalReports(): Promise<GlobalModelReport[]> {
    try {
      const { data: signals, error } = await supabaseServer
        .from('global_risk_signals')
        .select('*');

      if (error) throw error;

      const modelMap = signals.reduce((acc: any, s) => {
        if (!acc[s.model_name]) acc[s.model_name] = { total_risk: 0, count: 0, hall: 0, inject: 0 };
        acc[s.model_name].total_risk += Number(s.risk_score) * s.frequency;
        acc[s.model_name].count += s.frequency;
        if (s.signal_type === 'hallucination') acc[s.model_name].hall += s.frequency;
        if (s.signal_type === 'prompt_injection') acc[s.model_name].inject += s.frequency;
        return acc;
      }, {});

      return Object.keys(modelMap).map(name => {
        const m = modelMap[name];
        return {
          name,
          global_risk_score: m.total_risk / m.count,
          hallucination_frequency: (m.hall / m.count) * 100,
          injection_activity: (m.inject / m.count) * 100,
          sample_size: m.count
        };
      });
    } catch (err: any) {
      logger.error('GLOBAL_REPORT_GENERATION_FAILED', { error: err.message });
      throw err;
    }
  }

  /**
   * Seed demo global signals.
   */
  static async seedNetworkIntelligence() {
    const models = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'mistral-large', 'llama-3-70b'];
    const types = ['hallucination', 'prompt_injection', 'policy_bypass', 'pii_exposure', 'toxicity', 'drift_anomaly'];
    
    for (const model of models) {
      for (const type of types) {
        await this.ingestSignal({
          model_name: model,
          signal_type: type,
          risk_score: Math.random() * 60 + 10,
          pattern_hash: `seed-${model}-${type}-${Math.random().toString(36).slice(2, 6)}`
        });
      }
    }
    return { status: 'seeded' };
  }
}
