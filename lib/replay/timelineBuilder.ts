import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface TimelineEvent {
  id?: string;
  session_id: string;
  event_type: 'message' | 'evaluation' | 'drift_alert' | 'governance_escalation';
  event_reference: any;
  timestamp: string;
}

export class TimelineBuilder {
  /**
   * Constructs the complete chronological timeline merging discrete events.
   * Leverages deterministic historical playback mapped against the conversation boundary.
   */
  static async reconstructSession(sessionId: string, orgId: string): Promise<TimelineEvent[]> {
    logger.info('TIMELINE_RECONSTRUCTION_STARTED', { sessionId, orgId });

    // 1. Initial Retrieval mapped against precise RLS and Index sequences
    const { data: timeline, error } = await supabaseServer
      .from('conversation_timeline')
      .select('id, session_id, event_type, event_reference, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
       logger.error('TIMELINE_RETRIEVAL_ERROR', { error });
       throw new Error(`Failed to retrieve session timeline: ${error.message}`);
    }

    if (!timeline || timeline.length === 0) {
       return [];
    }

    // 2. Engine Parsing and Type Mapping
    // Real implementation would hydrate 'event_reference' IDs into actual structures 
    // if they were stored purely relationally.
    // In our payload-centric approach, `event_reference` contains structured JSON dictating bounds.
    return timeline.map(event => ({
      id: event.id,
      session_id: event.session_id,
      event_type: event.event_type as TimelineEvent['event_type'],
      event_reference: typeof event.event_reference === 'string' ? JSON.parse(event.event_reference) : event.event_reference,
      timestamp: event.timestamp
    }));
  }

  /**
   * Pushes a specific chronological event node onto the pipeline
   */
  static async appendEvent(event: TimelineEvent): Promise<void> {
    const { error } = await supabaseServer
      .from('conversation_timeline')
      .insert({
        session_id: event.session_id,
        event_type: event.event_type,
        event_reference: event.event_reference,
        timestamp: event.timestamp || new Date().toISOString()
      });

    if (error) {
      logger.error('TIMELINE_APPEND_ERROR', { error, event });
    }
  }
}
