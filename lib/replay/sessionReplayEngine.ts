import { buildTimeline, TimelineResult } from './timelineBuilder';
import { logger } from '../logger';

export interface ReplaySummary extends TimelineResult {
  totalEvents: number;
}

/**
 * Session Replay Engine
 * 
 * Provides a high-level orchestration for session reconstruction.
 * Coordinates between raw timeline building and auxiliary auditing signals.
 */
export class SessionReplayEngine {
  
  /**
   * Replays a session by reconstructing its deterministic timeline.
   */
  static async replaySession(sessionId: string): Promise<ReplaySummary | null> {
    logger.info('SESSION_REPLAY_REQUESTED', { sessionId });

    try {
      const timelineData = await buildTimeline(sessionId);

      if (!timelineData) {
        logger.warn('SESSION_REPLAY_EMPTY_TIMELINE', { sessionId });
        return null;
      }

      const summary: ReplaySummary = {
        ...timelineData,
        totalEvents: timelineData.timeline.length
      };

      logger.info('SESSION_REPLAY_BUILT', { 
        sessionId, 
        totalEvents: summary.totalEvents,
        riskPeaks: summary.riskPeaks.length,
        policyTriggers: summary.policyTriggers.length
      });

      return summary;

    } catch (err: any) {
      logger.error('SESSION_REPLAY_ENGINE_ERROR', { sessionId, error: err.message });
      return null;
    }
  }
}
