import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface BehaviorBaseline {
  model_name: string;
  avg_hallucination: number;
  avg_violations: number;
  avg_risk: number;
  sample_count: number;
}

export interface BehaviorCluster {
  label: string;
  description: string;
  models: string[];
  metrics: {
    risk: 'low' | 'medium' | 'high';
    reliability: number;
  };
}

/**
 * Behavior Profiler Engine (Phase 51)
 * Analyzes long-term model behavior dataset to generate baselines and clusters.
 */
export class BehaviorProfiler {
  /**
   * Aggregates recent behavior for an organization.
   */
  static async getReliabilityReport(orgId: string) {
    try {
      const { data: behavior, error } = await supabaseServer
        .from('model_behavior')
        .select('*')
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group by model
      const modelGroups = behavior.reduce((acc: any, curr) => {
        if (!acc[curr.model_name]) acc[curr.model_name] = { hall: [], viol: [], risk: [], len: [] };
        acc[curr.model_name].hall.push(Number(curr.hallucination_rate));
        acc[curr.model_name].viol.push(Number(curr.policy_violations));
        acc[curr.model_name].risk.push(Number(curr.risk_score));
        acc[curr.model_name].len.push(Number(curr.response_length));
        return acc;
      }, {});

      const baselines: BehaviorBaseline[] = Object.keys(modelGroups).map(name => {
        const group = modelGroups[name];
        return {
          model_name: name,
          avg_hallucination: group.hall.reduce((a: number, b: number) => a + b, 0) / group.hall.length,
          avg_violations: group.viol.reduce((a: number, b: number) => a + b, 0) / group.viol.length,
          avg_risk: group.risk.reduce((a: number, b: number) => a + b, 0) / group.risk.length,
          avg_length: group.len.reduce((a: number, b: number) => a + b, 0) / group.len.length,
          sample_count: group.hall.length
        };
      });

      // Generate behavior clusters based on risk and hallucination profiles
      const clusters: BehaviorCluster[] = this.computeClusters(baselines);

      return { baselines, clusters, total_snapshots: behavior.length };
    } catch (err: any) {
      logger.error('BEHAVIOR_PROFILER_AGGREGATION_FAILED', { error: err.message, orgId });
      throw err;
    }
  }

  private static computeClusters(baselines: any[]): BehaviorCluster[] {
    const clusters: BehaviorCluster[] = [
      {
        label: 'Stable Determinists',
        description: 'Consistent, low-hallucination models with high instruction following.',
        models: baselines.filter(b => b.avg_hallucination < 15 && b.avg_risk < 20).map(b => b.model_name),
        metrics: { risk: 'low', reliability: 95 }
      },
      {
        label: 'Verbosity Seekers',
        description: 'Longer response patterns with periodic hallucination risk.',
        models: baselines.filter(b => b.avg_length > 1500 && b.avg_hallucination >= 15).map(b => b.model_name),
        metrics: { risk: 'medium', reliability: 78 }
      },
      {
        label: 'High-Risk Experimentalists',
        description: 'Models showing highly volatile risk scores and frequent policy drift.',
        models: baselines.filter(b => b.avg_risk > 50).map(b => b.model_name),
        metrics: { risk: 'high', reliability: 45 }
      }
    ];

    return clusters.filter(c => c.models.length > 0);
  }

  /**
   * Seed historical behavior data.
   */
  static async seedDemoBehavior(orgId: string) {
    const models = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'mistral-large', 'llama-3-70b'];
    const records = [];

    for (const model of models) {
      // Create 20 snapshots per model over the last 30 days
      for (let i = 0; i < 20; i++) {
        const base_hall = model.includes('gpt') ? 5 : model.includes('llama') ? 25 : 12;
        const base_risk = model.includes('claude') ? 8 : 15;
        
        records.push({
          model_name: model,
          org_id: orgId,
          hallucination_rate: Math.max(0, base_hall + (Math.random() * 20 - 10)),
          policy_violations: Math.floor(Math.random() * 5),
          risk_score: Math.max(0, base_risk + (Math.random() * 30 - 15)),
          response_length: Math.floor(Math.random() * 2000 + 400),
          timestamp: new Date(Date.now() - (i * 1.5 * 86400000) - Math.random() * 86400000).toISOString()
        });
      }
    }

    await supabaseServer.from('model_behavior').insert(records);
    return { count: records.length };
  }
}
