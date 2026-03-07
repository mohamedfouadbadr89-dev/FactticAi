/**
 * Attack Graph Engine
 *
 * Transforms raw session attack analyses into a directed graph structure
 * suitable for visualization (D3.js, vis.js, Mermaid, Cytoscape).
 *
 * Graph model:
 *   Node  = one AttackPhase (one conversation turn in one session)
 *   Edge  = directed transition between two consecutive phases
 *   Cluster = group of sessions sharing the same AttackPattern
 *
 * The graph is multi-session: all sessions for an org are combined into
 * one graph, with clusters separating sessions by attack pattern type.
 * This lets the UI render attack progression across an entire org's history
 * as a single connected threat map.
 */

import { createHash } from 'crypto'
import {
  SessionReconstructionEngine,
  type PhaseLabel,
  type AttackPattern,
  type SessionAttackAnalysis,
  type AttackPhase,
} from '../forensics/sessionReconstructionEngine'
import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Visual weight of a node — drives node size and colour in UI renderers. */
export type NodeWeight = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AttackGraphNode {
  /** Globally unique: `<session_id>:<turn_index>` */
  node_id:      string
  session_id:   string
  turn_index:   number
  phase:        PhaseLabel
  /** Visual weight derived from risk_score for rendering. */
  weight:       NodeWeight
  risk_score:   number
  decision:     string
  attack_types: string[]
  timestamp:    number
}

export interface AttackGraphEdge {
  /** `<from_node_id>→<to_node_id>` */
  edge_id:    string
  from:       string
  to:         string
  session_id: string
  /** Human-readable transition label: e.g. `BENIGN→PROBING` */
  transition: string
  /** True when the target node has a higher risk_score than the source. */
  escalating: boolean
  risk_delta: number
}

/**
 * A cluster groups all sessions that share the same named attack pattern.
 * Renders as a visual grouping boundary in the attack graph.
 */
export interface AttackCluster {
  cluster_id:     string
  attack_pattern: AttackPattern
  session_ids:    string[]
  session_count:  number
  avg_risk_score: number
  /** Worst phase reached by any session in this cluster. */
  peak_phase:     PhaseLabel
}

export interface AttackGraphStats {
  total_nodes:     number
  total_edges:     number
  total_clusters:  number
  /** Nodes at EXFILTRATION or ESCALATION phase. */
  critical_nodes:  number
  /** Edges where risk increased from source to target. */
  escalating_edges: number
  attack_patterns: AttackPattern[]
  phase_distribution: Record<PhaseLabel, number>
}

export interface AttackGraph {
  graph_id:          string
  org_id:            string
  nodes:             AttackGraphNode[]
  edges:             AttackGraphEdge[]
  clusters:          AttackCluster[]
  sessions_analyzed: number
  stats:             AttackGraphStats
  generated_at:      string
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase ordering — used to determine edge directionality and escalation
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_RANK: Record<PhaseLabel, number> = {
  BENIGN:       0,
  PROBING:      1,
  INJECTION:    2,
  EXFILTRATION: 3,
  ESCALATION:   3,
}

function toNodeWeight(risk: number): NodeWeight {
  if (risk >= 90) return 'CRITICAL'
  if (risk >= 70) return 'HIGH'
  if (risk >= 40) return 'MEDIUM'
  return 'LOW'
}

// ─────────────────────────────────────────────────────────────────────────────
// buildSessionGraph — converts one SessionAttackAnalysis into nodes + edges
// ─────────────────────────────────────────────────────────────────────────────

function buildSessionGraph(analysis: SessionAttackAnalysis): {
  nodes: AttackGraphNode[]
  edges: AttackGraphEdge[]
} {
  const nodes: AttackGraphNode[] = analysis.phases.map(phase => ({
    node_id:      `${analysis.session_id}:${phase.turn_index}`,
    session_id:   analysis.session_id,
    turn_index:   phase.turn_index,
    phase:        phase.phase,
    weight:       toNodeWeight(phase.risk_score),
    risk_score:   phase.risk_score,
    decision:     phase.decision,
    attack_types: phase.attack_types,
    timestamp:    phase.timestamp,
  }))

  const edges: AttackGraphEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const src = nodes[i]
    const tgt = nodes[i + 1]
    edges.push({
      edge_id:    `${src.node_id}→${tgt.node_id}`,
      from:       src.node_id,
      to:         tgt.node_id,
      session_id: analysis.session_id,
      transition: `${src.phase}→${tgt.phase}`,
      escalating: tgt.risk_score > src.risk_score,
      risk_delta: tgt.risk_score - src.risk_score,
    })
  }

  return { nodes, edges }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildAttackGraph — pure, accepts pre-fetched analyses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a full multi-session AttackGraph from an array of
 * SessionAttackAnalysis objects (already reconstructed).
 *
 * Pure — no I/O.
 *
 * @param analyses  Array of SessionAttackAnalysis results.
 * @param org_id    Org identifier for graph metadata.
 */
export function buildAttackGraph(
  analyses: SessionAttackAnalysis[],
  org_id: string
): AttackGraph {
  const allNodes: AttackGraphNode[] = []
  const allEdges: AttackGraphEdge[] = []
  const clusterMap = new Map<AttackPattern, {
    session_ids:   string[]
    risk_scores:   number[]
    peak_phase:    PhaseLabel
  }>()

  for (const analysis of analyses) {
    const { nodes, edges } = buildSessionGraph(analysis)
    allNodes.push(...nodes)
    allEdges.push(...edges)

    if (!analysis.attack_pattern) continue

    if (!clusterMap.has(analysis.attack_pattern)) {
      clusterMap.set(analysis.attack_pattern, {
        session_ids: [],
        risk_scores: [],
        peak_phase:  'BENIGN',
      })
    }

    const cluster = clusterMap.get(analysis.attack_pattern)!
    cluster.session_ids.push(analysis.session_id)

    const sessionPeakRisk  = Math.max(...analysis.phases.map(p => p.risk_score))
    cluster.risk_scores.push(sessionPeakRisk)

    // Track worst phase seen in this cluster
    const sessionPeakPhase = analysis.phases.reduce(
      (worst, p) => PHASE_RANK[p.phase] > PHASE_RANK[worst] ? p.phase : worst,
      'BENIGN' as PhaseLabel
    )
    if (PHASE_RANK[sessionPeakPhase] > PHASE_RANK[cluster.peak_phase]) {
      cluster.peak_phase = sessionPeakPhase
    }
  }

  const clusters: AttackCluster[] = []
  let clusterIdx = 0
  for (const [pattern, data] of clusterMap.entries()) {
    clusters.push({
      cluster_id:     `cluster-${clusterIdx++}`,
      attack_pattern: pattern,
      session_ids:    data.session_ids,
      session_count:  data.session_ids.length,
      avg_risk_score: data.risk_scores.length > 0
        ? Math.round(data.risk_scores.reduce((s, r) => s + r, 0) / data.risk_scores.length)
        : 0,
      peak_phase: data.peak_phase,
    })
  }

  // Phase distribution
  const phaseDist: Record<PhaseLabel, number> = {
    BENIGN: 0, PROBING: 0, INJECTION: 0, EXFILTRATION: 0, ESCALATION: 0,
  }
  for (const n of allNodes) phaseDist[n.phase]++

  const graphId = createHash('sha256')
    .update(`${org_id}:${Date.now()}`)
    .digest('hex')
    .substring(0, 16)

  return {
    graph_id: graphId,
    org_id,
    nodes:    allNodes,
    edges:    allEdges,
    clusters,
    sessions_analyzed: analyses.length,
    stats: {
      total_nodes:     allNodes.length,
      total_edges:     allEdges.length,
      total_clusters:  clusters.length,
      critical_nodes:  allNodes.filter(n => n.phase === 'EXFILTRATION' || n.phase === 'ESCALATION').length,
      escalating_edges: allEdges.filter(e => e.escalating).length,
      attack_patterns: [...new Set(
        analyses.map(a => a.attack_pattern).filter(Boolean) as AttackPattern[]
      )],
      phase_distribution: phaseDist,
    },
    generated_at: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AttackGraphEngine — database-backed service
// ─────────────────────────────────────────────────────────────────────────────

export const AttackGraphEngine = {

  /**
   * Fetches recent sessions for an org, reconstructs attack analyses,
   * and returns the full multi-session attack graph.
   *
   * @param orgId         Organisation ID.
   * @param sessionLimit  How many recent sessions to include. Default: 50.
   */
  async buildOrgGraph(orgId: string, sessionLimit = 50): Promise<AttackGraph | null> {
    // Fetch distinct session IDs for this org
    const { data: rows, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('session_id')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(sessionLimit * 10)   // over-fetch; deduplicate below

    if (error || !rows) {
      logger.error('ATTACK_GRAPH_SESSION_FETCH_FAILED', { orgId, error: error?.message })
      return null
    }

    const sessionIds = [...new Set(rows.map((r: any) => r.session_id as string))]
      .slice(0, sessionLimit)

    if (sessionIds.length === 0) return null

    const results = await SessionReconstructionEngine.batchReconstruct(sessionIds, orgId)
    const analyses = results.map(r => r.attack_analysis)

    const graph = buildAttackGraph(analyses, orgId)

    logger.info('ATTACK_GRAPH_BUILT', {
      orgId,
      sessions: graph.sessions_analyzed,
      nodes:    graph.stats.total_nodes,
      clusters: graph.stats.total_clusters,
    })

    return graph
  },

  /** Exposed for offline / test usage. */
  buildAttackGraph,
}
