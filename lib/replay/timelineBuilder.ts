import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  content: string;
  risk_score: number;
}

export interface TimelineResult {
  timeline: TimelineEvent[];
  riskPeaks: TimelineEvent[];
  policyTriggers: TimelineEvent[];
}

/**
 * Deterministic Session Timeline Builder
 * Reconstructs the chronological sequence of events for a given session.
 */
export async function buildTimeline(sessionId: string): Promise<TimelineResult | null> {
  try {
    const { data: events, error } = await supabaseServer
      .from('conversation_timeline')
      .select('timestamp, event_type, event_reference')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      logger.error('TIMELINE_QUERY_FAILED', { sessionId, error: error.message });
      throw error;
    }

    if (!events) return { timeline: [], riskPeaks: [], policyTriggers: [] };

    const timeline: TimelineEvent[] = events.map(event => {
      const ref = typeof event.event_reference === 'string' 
        ? JSON.parse(event.event_reference) 
        : (event.event_reference || {});

      return {
        timestamp: event.timestamp,
        event_type: event.event_type,
        content: ref.content || '',
        risk_score: ref.risk_score || 0
      };
    });

    // Detect risk peaks (score > 70)
    const riskPeaks = timeline.filter(event => event.risk_score > 70);

    // Detect policy triggers
    const policyTriggers = timeline.filter(event => event.event_type === 'policy_violation');

    return {
      timeline,
      riskPeaks,
      policyTriggers
    };

  } catch (err: any) {
    logger.error('TIMELINE_BUILD_FAILED', { sessionId, error: err.message });
    return null;
  }
}
