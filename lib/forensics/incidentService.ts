import { supabaseServer } from '../supabaseServer';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LedgerEvent {
  id: string;
  session_id: string;
  org_id: string;
  timestamp: number;        // BIGINT unix-ms
  prompt: string | null;
  decision: string;
  risk_score: number;
  violations: any[];
  guardrail_signals: Record<string, any>;
  latency: number;
  model: string;
  simulation_id?: string;
}

export interface IncidentThread {
  session_id: string;
  severity: IncidentSeverity;
  events: LedgerEvent[];
  startTime: number;        // unix-ms
}

/**
 * AI Incident Service (v3.0)
 *
 * CORE PRINCIPLE: Single canonical source — facttic_governance_events.
 * All reads use the EvidenceLedger table so forensic and incident views
 * are consistent with the hash-chain audit trail.
 */
export const IncidentService = {
  /**
   * Fetches the latest events for an organization and groups them by session.
   */
  async getIncidents(orgId: string): Promise<IncidentThread[]> {
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, guardrail_signals, latency, model, simulation_id')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    const events = data as LedgerEvent[];
    const threads: Record<string, IncidentThread> = {};

    events.forEach(event => {
      const sessionId = event.session_id || 'untracked-session';
      if (!threads[sessionId]) {
        threads[sessionId] = {
          session_id: sessionId,
          severity: 'LOW',
          events: [],
          startTime: Number(event.timestamp),
        };
      }

      threads[sessionId].events.push(event);

      // Severity: CRITICAL ≥90, HIGH ≥70, MEDIUM ≥40, LOW else
      const score = event.risk_score;
      const current = threads[sessionId].severity;
      if (score >= 90) {
        threads[sessionId].severity = 'CRITICAL';
      } else if (score >= 70 && current !== 'CRITICAL') {
        threads[sessionId].severity = 'HIGH';
      } else if (score >= 40 && current !== 'CRITICAL' && current !== 'HIGH') {
        threads[sessionId].severity = 'MEDIUM';
      }

      const ts = Number(event.timestamp);
      if (ts < threads[sessionId].startTime) {
        threads[sessionId].startTime = ts;
      }
    });

    return Object.values(threads).sort((a, b) => b.startTime - a.startTime);
  },

  /**
   * Fetches events for a specific interaction session.
   */
  async getIncidentBySession(orgId: string, sessionId: string): Promise<IncidentThread | null> {
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, guardrail_signals, latency, model, simulation_id')
      .eq('org_id', orgId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    const events = data as LedgerEvent[];
    const thread: IncidentThread = {
      session_id: sessionId,
      severity: 'LOW',
      events,
      startTime: Number(events[0].timestamp),
    };

    events.forEach(event => {
      const score = event.risk_score;
      if (score >= 90) {
        thread.severity = 'CRITICAL';
      } else if (score >= 70 && thread.severity !== 'CRITICAL') {
        thread.severity = 'HIGH';
      } else if (score >= 40 && thread.severity !== 'CRITICAL' && thread.severity !== 'HIGH') {
        thread.severity = 'MEDIUM';
      }
    });

    return thread;
  }
};
