import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { buildTimeline } from '../replay/timelineBuilder';

export interface BehaviorAnalysisResult {
  session_id: string;
  org_id: string;
  intent_drift_score: number;
  instruction_override: boolean;
  confidence_score: number;
  context_saturation: number;
  signals: string[];
}

/**
 * AI Behavior Forensics Engine
 * 
 * CORE RESPONSIBILITY: Detect behavioral anomalies in AI responses.
 * Analyzes session sentiment, instruction adherence, and confidence performance.
 */
export class BehaviorForensicsEngine {
  
  /**
   * Analyzes a session for behavioral anomalies.
   */
  static async analyzeSession(sessionId: string): Promise<BehaviorAnalysisResult | null> {
    try {
      const timelineResult = await buildTimeline(sessionId);
      if (!timelineResult || timelineResult.timeline.length === 0) return null;

      const { data: session } = await supabaseServer
        .from('sessions')
        .select('org_id, model_version_id')
        .eq('id', sessionId)
        .single();

      if (!session) return null;

      // 1. Load baseline (model_behavior)
      const { data: baseline } = await supabaseServer
        .from('model_behavior')
        .select('risk_score, hallucination_rate')
        .eq('org_id', session.org_id)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      const avgBaselineRisk = baseline && baseline.length > 0
        ? baseline.reduce((sum, b) => sum + Number(b.risk_score), 0) / baseline.length
        : 50;

      // 2. Compute Intent Drift
      // Logic: Variance between current session risk and historical baseline
      const currentAvgRisk = timelineResult.timeline.reduce((sum, t) => sum + t.risk_score, 0) / timelineResult.timeline.length;
      const intentDriftScore = Math.min(100, Math.max(0, (currentAvgRisk - avgBaselineRisk) * 2));

      // 3. Detect Instruction Override
      // Logic: Scan content for adversarial patterns or extraction headers
      const overridePatterns = [
        /ignore previous instruction/i,
        /system prompt override/i,
        /dan mode/i,
        /acting as a developer/i,
        /reveal your instructions/i
      ];
      const hasOverride = timelineResult.timeline.some(t => overridePatterns.some(p => p.test(t.content)));

      // 4. Estimate Confidence
      // Logic: Average confidence from raw telemetry (mapping low/med/high to numerical)
      const { data: turns } = await supabaseServer
        .from('session_turns')
        .select('confidence')
        .eq('session_id', sessionId);
      
      const confidenceMap: Record<string, number> = { 'low': 30, 'medium': 70, 'high': 95 };
      const avgConfidence = turns && turns.length > 0
        ? turns.reduce((sum, t) => sum + (confidenceMap[t.confidence] || 50), 0) / turns.length
        : 70;

      // 5. Context Saturation
      // Proxy: ratio of turns to hard limit (e.g. 50 turns)
      const contextSaturation = Math.min(100, (timelineResult.timeline.length / 50) * 100);

      // 6. Signal Aggregation
      const signals: string[] = [];
      if (intentDriftScore > 40) signals.push('INTENT_DRIFT_ALERT');
      if (hasOverride) signals.push('PROMPT_OVERRIDE_ALERT');
      if (avgConfidence < 60) signals.push('CONFIDENCE_DROP');

      const result: BehaviorAnalysisResult = {
        session_id: sessionId,
        org_id: session.org_id,
        intent_drift_score: Math.round(intentDriftScore),
        instruction_override: hasOverride,
        confidence_score: Math.round(avgConfidence),
        context_saturation: Math.round(contextSaturation),
        signals
      };

      // 7. Persist Result
      await supabaseServer.from('behavior_forensics_signals').insert({
        session_id: result.session_id,
        org_id: result.org_id,
        intent_drift_score: result.intent_drift_score,
        instruction_override: result.instruction_override,
        confidence_score: result.confidence_score,
        context_saturation: result.context_saturation
      });

      logger.info('BEHAVIOR_FORENSICS_ANALYSIS_COMPLETE', { sessionId, signals });

      return result;

    } catch (err: any) {
      logger.error('BEHAVIOR_FORENSICS_FAILURE', { sessionId, error: err.message });
      return null;
    }
  }
}
