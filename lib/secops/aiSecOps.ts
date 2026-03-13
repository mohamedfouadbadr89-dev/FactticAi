/**
 * Facttic AI Security Operations Platform — Entry Point
 *
 * Single import surface for all SecOps modules.
 * Provides a unified AISecOps service for orchestrating multi-module
 * security analysis workflows.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYSTEM ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │               FACTTIC AI SECURITY OPERATIONS PLATFORM                   │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────────┐
 *  │  INGESTION & PERSISTENCE                                                 │
 *  │                                                                          │
 *  │   User Prompt ──► GovernancePipeline ──► DECISION (BLOCK/WARN/ALLOW)    │
 *  │                         │                                                │
 *  │                         │  runAnalyzers() [12 parallel analyzers]        │
 *  │                         │  computeCompositeRisk() [weighted scoring]     │
 *  │                         ▼                                                │
 *  │              EvidenceLedger.write()                                      │
 *  │              SHA-256 hash + HMAC signature + chain link                  │
 *  │                         │                                                │
 *  │                         ▼                                                │
 *  │         facttic_governance_events  (Tamper-Evident Ledger)               │
 *  └─────────────────────────────┬────────────────────────────────────────────┘
 *                                │
 *                                │  All SecOps modules read from this table
 *                                │
 *  ┌─────────────────────────────▼────────────────────────────────────────────┐
 *  │  SECOPS MODULES                                                          │
 *  │                                                                          │
 *  │  ┌──────────────────────┐   ┌──────────────────────────────────────────┐ │
 *  │  │  1. ATTACK GRAPH     │   │  2. ROOT CAUSE ENGINE                    │ │
 *  │  │                      │   │                                          │ │
 *  │  │  Multi-session graph │   │  Failure category classification:        │ │
 *  │  │  Nodes = turns       │   │   ADVERSARIAL_INPUT                      │ │
 *  │  │  Edges = transitions │   │   GUARDRAIL_BYPASS                       │ │
 *  │  │  Clusters = patterns │   │   POLICY_COVERAGE_GAP                    │ │
 *  │  │                      │   │   CONTEXT_MANIPULATION                   │ │
 *  │  │  BENIGN              │   │   MODEL_BEHAVIOR_DRIFT                   │ │
 *  │  │   └► PROBING         │   │   UNKNOWN                                │ │
 *  │  │       └► INJECTION   │   │                                          │ │
 *  │  │           └► EXFIL   │   │  + Contributing factors                  │ │
 *  │  │                      │   │  + Detection gaps                        │ │
 *  │  │  SLOW_ESCALATION     │   │  + Evidence chain                        │ │
 *  │  │  DIRECT_ATTACK       │   │  + Remediation steps                     │ │
 *  │  │  JAILBREAK_CHAIN     │   └──────────────────────────────────────────┘ │
 *  │  │  RECONNAISSANCE      │                                               │
 *  │  │  MIXED_VECTOR        │   ┌──────────────────────────────────────────┐ │
 *  │  │  POLICY_BYPASS       │   │  3. DRIFT DETECTION ENGINE               │ │
 *  │  └──────────────────────┘   │                                          │ │
 *  │                             │  Window-based statistical analysis:      │ │
 *  │  ┌──────────────────────┐   │   RISK_SCORE_DRIFT     (Z-score)         │ │
 *  │  │  4. ALERTING ENGINE  │   │   DECISION_RATIO_SHIFT (Z-score)         │ │
 *  │  │                      │   │   VIOLATION_DENSITY_SPIKE                │ │
 *  │  │  Rule-based triggers:│   │   VELOCITY_SPIKE                         │ │
 *  │  │  AR-001 risk > 80 P1 │   │                                          │ │
 *  │  │  AR-002 risk > 60 P2 │   │  Severity: CRITICAL/HIGH/MEDIUM/LOW/NONE │ │
 *  │  │  AR-003 multi-viol P2│   └──────────────────────────────────────────┘ │
 *  │  │  AR-004 BLOCK      P2│                                               │
 *  │  │  AR-007 jailbrk    P1│   ┌──────────────────────────────────────────┐ │
 *  │  │  AR-008 slow-esc   P1│   │  5. INCIDENT SEVERITY DASHBOARD          │ │
 *  │  │  ...10 rules total   │   │                                          │ │
 *  │  │                      │   │  Sections:                               │ │
 *  │  │  Channels:           │   │   Severity summary (CRIT/HIGH/MED/LOW)   │ │
 *  │  │   LOG                │   │   Active incidents (last 24h)            │ │
 *  │  │   DATABASE           │   │   Risk trend (30-day rolling avg)        │ │
 *  │  │   WEBHOOK            │   │   Top attack vectors                     │ │
 *  │  └──────────────────────┘   │   Decision breakdown (BLOCK/WARN/ALLOW)  │ │
 *  │                             │   Alert heatmap (hour-of-day)            │ │
 *  │  ┌──────────────────────┐   │   MTTR estimate                          │ │
 *  │  │  6. FAILURE AUTOPSY  │   └──────────────────────────────────────────┘ │
 *  │  │                      │                                               │
 *  │  │  Five-layer analysis:│                                               │
 *  │  │  L1 DETECTION        │                                               │
 *  │  │  L2 SCORING          │                                               │
 *  │  │  L3 DECISION         │                                               │
 *  │  │  L4 ENFORCEMENT      │                                               │
 *  │  │  L5 BEHAVIORAL       │                                               │
 *  │  │                      │                                               │
 *  │  │  Failure modes:      │                                               │
 *  │  │  UNDETECTED_ATTACK   │                                               │
 *  │  │  UNDER_SCORED        │                                               │
 *  │  │  DECISION_NOT_ENFORC │                                               │
 *  │  │  MULTI_TURN_BLIND    │                                               │
 *  │  │  MODEL_COMPLIANCE    │                                               │
 *  │  │  THRESHOLD_MISCALIB  │                                               │
 *  │  └──────────────────────┘                                               │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  SUPPORTING INTELLIGENCE LAYER (feeds SecOps modules)                   │
 *  │                                                                         │
 *  │  AIThreatIntelligence    6 threat profiles, IoCs, MITRE refs            │
 *  │  SessionReconstructionEngine  Thread + AttackProgression analysis       │
 *  │  IncidentTimelineEngine  Session grouping, severity classification      │
 *  │  EvidenceLedger          Hash chain integrity + replay validation       │
 *  └─────────────────────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports — full public API of the SecOps platform
// ─────────────────────────────────────────────────────────────────────────────

// Module 1: Attack Graph
export {
  AttackGraphEngine,
  buildAttackGraph,
  type AttackGraph,
  type AttackGraphNode,
  type AttackGraphEdge,
  type AttackCluster,
  type AttackGraphStats,
} from './attackGraph'

// Module 2: Root Cause Engine
export {
  RootCauseEngine,
  performRootCauseAnalysis,
  type RootCauseReport,
  type RootCauseCategory,
  type ContributingFactor,
  type DetectionGap,
  type EvidenceEntry,
  type RemediationStep,
  type FailureSeverity,
} from './rootCauseEngine'

// Module 3: Drift Detection
export {
  DriftDetectionEngine,
  buildDriftReport,
  type DriftDetectionReport,
  type DriftSignal,
  type DriftType,
  type DriftSeverity,
  type MetricProfile,
} from './driftDetectionEngine'

// Module 4: Alerting Engine
export {
  SecOpsAlertingEngine,
  BUILT_IN_RULES,
  type AlertEvaluation,
  type FiredAlert,
  type AlertRule,
  type AlertContext,
  type AlertPriority,
  type AlertChannel,
} from './alertingEngine'

// Module 5: Incident Severity Dashboard
export {
  IncidentSeverityDashboard,
  buildDashboardSnapshot,
  type DashboardSnapshot,
  type SeveritySummary,
  type RiskTrendPoint,
  type ActiveIncident,
  type AttackVectorSummary,
  type DecisionBreakdown,
} from './incidentSeverityDashboard'

// Module 6: Failure Autopsy
export {
  FailureAutopsyEngine,
  performAutopsy,
  type AutopsyReport,
  type LayerAssessment,
  type FailureMode,
  type FailureLayer,
  type LayerStatus,
  type AutopsyTimelineEvent,
  type Prescription,
} from './failureAutopsy'

// ─────────────────────────────────────────────────────────────────────────────
// AISecOps — unified orchestration service
// ─────────────────────────────────────────────────────────────────────────────

import { AttackGraphEngine }           from './attackGraph'
import { RootCauseEngine }             from './rootCauseEngine'
import { DriftDetectionEngine }        from './driftDetectionEngine'
import { SecOpsAlertingEngine }        from './alertingEngine'
import { IncidentSeverityDashboard }   from './incidentSeverityDashboard'
import { FailureAutopsyEngine }        from './failureAutopsy'
import { logger }                      from '../logger'

export interface FullSessionAnalysis {
  root_cause: Awaited<ReturnType<typeof RootCauseEngine.analyzeSession>>
  autopsy:    Awaited<ReturnType<typeof FailureAutopsyEngine.perform>>
}

export interface OrgSecOpsReport {
  org_id:      string
  generated_at: string
  dashboard:   Awaited<ReturnType<typeof IncidentSeverityDashboard.getSnapshot>>
  attack_graph: Awaited<ReturnType<typeof AttackGraphEngine.buildOrgGraph>>
  drift:        Awaited<ReturnType<typeof DriftDetectionEngine.detect>>
}

export const AISecOps = {

  /**
   * Full session-level analysis: root cause + failure autopsy.
   * Runs both in parallel and returns the combined result.
   *
   * @param sessionId  Session UUID.
   * @param orgId      Organisation identifier.
   */
  async analyzeSession(sessionId: string, orgId: string): Promise<FullSessionAnalysis> {
    logger.info('SECOPS_SESSION_ANALYSIS_START', { sessionId, orgId })

    const [root_cause, autopsy] = await Promise.allSettled([
      RootCauseEngine.analyzeSession(sessionId, orgId),
      FailureAutopsyEngine.perform(sessionId, orgId),
    ])

    return {
      root_cause: root_cause.status === 'fulfilled' ? root_cause.value : null,
      autopsy:    autopsy.status === 'fulfilled'    ? autopsy.value    : null,
    }
  },

  /**
   * Full org-level SecOps report: dashboard + attack graph + drift detection.
   * All three modules run in parallel.
   *
   * @param orgId      Organisation identifier.
   * @param graphLimit Max sessions to include in the attack graph. Default: 50.
   */
  async orgReport(orgId: string, graphLimit = 50): Promise<OrgSecOpsReport> {
    logger.info('SECOPS_ORG_REPORT_START', { orgId })

    const [dashboard, attack_graph, drift] = await Promise.allSettled([
      IncidentSeverityDashboard.getSnapshot(orgId),
      AttackGraphEngine.buildOrgGraph(orgId, graphLimit),
      DriftDetectionEngine.detect(orgId),
    ])

    return {
      org_id:       orgId,
      generated_at: new Date().toISOString(),
      dashboard:    dashboard.status === 'fulfilled'    ? dashboard.value    : null,
      attack_graph: attack_graph.status === 'fulfilled' ? attack_graph.value : null,
      drift:        drift.status === 'fulfilled'        ? drift.value        : null,
    }
  },

  // Direct module access
  AttackGraph:         AttackGraphEngine,
  RootCause:           RootCauseEngine,
  DriftDetection:      DriftDetectionEngine,
  Alerting:            SecOpsAlertingEngine,
  Dashboard:           IncidentSeverityDashboard,
  Autopsy:             FailureAutopsyEngine,
}
