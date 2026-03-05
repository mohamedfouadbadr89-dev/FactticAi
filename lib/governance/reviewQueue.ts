import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface ReviewEntry {
  id: string;
  session_id: string;
  risk_score: number;
  status: 'pending' | 'reviewing' | 'resolved';
  reviewer_id?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export class ReviewQueue {
  /**
   * Adds a high-risk session to the manual audit pipeline.
   */
  static async enqueueSession(sessionId: string, riskScore: number): Promise<void> {
    try {
      const { error } = await supabaseServer
        .from('governance_review_queue')
        .insert({
          session_id: sessionId,
          risk_score: riskScore,
          status: 'pending'
        });

      if (error) throw error;
      logger.info('SESSION_ENQUEUED_FOR_REVIEW', { sessionId, riskScore });
    } catch (err: any) {
      logger.error('ENQUEUE_FAILURE', { sessionId, error: err.message });
      throw err;
    }
  }

  /**
   * Bonds an auditor to a specific review request.
   */
  static async assignReviewer(reviewId: string, reviewerId: string): Promise<void> {
    try {
      const { error } = await supabaseServer
        .from('governance_review_queue')
        .update({
          reviewer_id: reviewerId,
          status: 'reviewing'
        })
        .eq('id', reviewId);

      if (error) throw error;
      logger.info('REVIEWER_ASSIGNED', { reviewId, reviewerId });
    } catch (err: any) {
      logger.error('ASSIGNMENT_FAILURE', { reviewId, error: err.message });
      throw err;
    }
  }

  /**
   * Finalizes the auditor forensic report and resolves the ticket.
   */
  static async resolveReview(reviewId: string, notes: string): Promise<void> {
    try {
      const { error } = await supabaseServer
        .from('governance_review_queue')
        .update({
          status: 'resolved',
          resolution_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      logger.info('REVIEW_RESOLVED', { reviewId });
    } catch (err: any) {
      logger.error('RESOLUTION_FAILURE', { reviewId, error: err.message });
      throw err;
    }
  }

  /**
   * Fetches active or resolved reviews.
   */
  static async getReviews(status?: string): Promise<ReviewEntry[]> {
    let query = supabaseServer
      .from('governance_review_queue')
      .select('*')
      .order('risk_score', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('FETCH_REVIEWS_FAILURE', { error: error.message });
      throw error;
    }

    return data || [];
  }
}
