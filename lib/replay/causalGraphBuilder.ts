import { TimelineEvent } from './timelineBuilder';

export interface CausalNode {
  id: string;
  label: string;
  type: 'prompt' | 'policy_violation' | 'governance_decision' | 'risk_score';
  metadata?: Record<string, any>;
}

export interface CausalEdge {
  from: string;
  to: string;
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

/**
 * Causal Graph Builder
 *
 * Derives a directed acyclic graph from a session timeline, representing
 * the causal chain: prompt → violation(s) → decision → risk_score.
 *
 * When no violations are present the path collapses to: prompt → decision → risk_score.
 * Multiple violation events produce individual nodes for granular visualization.
 */
export function buildCausalGraph(timeline: TimelineEvent[]): CausalGraph {
  const nodes: CausalNode[] = [];
  const edges: CausalEdge[] = [];

  if (timeline.length === 0) {
    return { nodes, edges };
  }

  const promptEvents    = timeline.filter(e => e.event_type === 'prompt_submitted');
  const violationEvents = timeline.filter(e => e.event_type === 'policy_violation');
  const decisionEvents  = timeline.filter(e => e.event_type === 'governance_decision');

  // ── Node: prompt ──────────────────────────────────────────────────────────
  if (promptEvents.length > 0) {
    nodes.push({
      id: 'prompt',
      label: 'User Prompt',
      type: 'prompt',
      metadata: { count: promptEvents.length }
    });
  }

  // ── Nodes: policy_violation (one per violation event) ─────────────────────
  violationEvents.forEach((event, idx) => {
    // content format from buildTimeline: "Violation: POLICY_NAME\nReason: ..."
    const firstLine  = event.content.split('\n')[0] ?? '';
    const policyName = firstLine.replace(/^Violation:\s*/i, '').trim() || 'Unknown Policy';

    nodes.push({
      id: `violation_${idx}`,
      label: `Policy Violation: ${policyName}`,
      type: 'policy_violation',
      metadata: {
        policy: policyName,
        risk_score: event.risk_score,
        content: event.content
      }
    });
  });

  // ── Node: governance_decision (use the highest-risk decision event) ────────
  const peakDecision = decisionEvents.length > 0
    ? decisionEvents.reduce((max, e) => e.risk_score > max.risk_score ? e : max, decisionEvents[0])
    : null;

  nodes.push({
    id: 'governance_decision',
    label: 'Governance Decision',
    type: 'governance_decision',
    metadata: {
      decision: peakDecision
        ? peakDecision.content.replace(/^Decision:\s*/i, '').trim()
        : 'UNKNOWN',
      risk_score: peakDecision?.risk_score ?? 0
    }
  });

  // ── Node: risk_score (peak across all events) ──────────────────────────────
  const peakRisk = timeline.reduce((max, e) => Math.max(max, e.risk_score), 0);

  nodes.push({
    id: 'risk_score',
    label: 'Risk Score',
    type: 'risk_score',
    metadata: { value: peakRisk }
  });

  // ── Edges ─────────────────────────────────────────────────────────────────
  if (violationEvents.length > 0) {
    // prompt → each violation, each violation → governance_decision
    violationEvents.forEach((_, idx) => {
      edges.push({ from: 'prompt', to: `violation_${idx}` });
      edges.push({ from: `violation_${idx}`, to: 'governance_decision' });
    });
  } else {
    // No violations: prompt flows directly to decision
    if (promptEvents.length > 0) {
      edges.push({ from: 'prompt', to: 'governance_decision' });
    }
  }

  // governance_decision → risk_score (always)
  edges.push({ from: 'governance_decision', to: 'risk_score' });

  return { nodes, edges };
}
