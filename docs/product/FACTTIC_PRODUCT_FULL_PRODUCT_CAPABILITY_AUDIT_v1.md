# FULL PRODUCT CAPABILITY AUDIT

## STEP 1 — System Architecture Map

**Engine name:** AlertEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/alerts/alertEngine.ts
**APIs using it:** /api/v1/governance/evaluate
**Tables used:** facttic_incidents, alerts

**Engine name:** ComplianceIntelligenceEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/compliance/complianceIntelligenceEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** compliance_signals, sessions, session_turns

**Engine name:** EvidenceExportEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/compliance/evidenceExportEngine.ts
**APIs using it:** /api/compliance/export
**Tables used:** facttic_governance_events, compliance_signals, evaluations

**Engine name:** CostAnomalyEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/economics/costAnomalyEngine.ts
**APIs using it:** /api/economics/cost-anomalies
**Tables used:** cost_metrics, cost_anomalies

**Engine name:** CostEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/economics/costEngine.ts
**APIs using it:** /api/cost/metrics
**Tables used:** cost_metrics

**Engine name:** BehaviorForensicsEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/forensics/behaviorForensicsEngine.ts
**APIs using it:** /api/forensics/behavior/[sessionId]
**Tables used:** facttic_governance_events, model_behavior, behavior_forensics_signals

**Engine name:** RcaEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/forensics/rcaEngine.ts
**APIs using it:** /api/forensics/rca/[sessionId]
**Tables used:** None

**Engine name:** RcaGraphEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/forensics/rcaGraphEngine.ts
**APIs using it:** /api/forensics/rca-graph/[sessionId]
**Tables used:** facttic_governance_events

**Engine name:** GovernanceAlertEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/alertEngine.ts
**APIs using it:** /api/chat, /api/governance/execute
**Tables used:** governance_alerts

**Engine name:** DataRetentionEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/dataRetentionEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** data_retention_policies

**Engine name:** GdprEraseEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/gdprEraseEngine.ts
**APIs using it:** /api/governance/gdpr-erase
**Tables used:** gdpr_erasure_requests, sessions

**Engine name:** GovernanceStateEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/governanceStateEngine.ts
**APIs using it:** /api/governance/state
**Tables used:** sessions, regression_signals, interceptor_events

**Engine name:** PolicyEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/policyEngine.ts
**APIs using it:** /api/governance/policy/evaluate, /api/trust/compliance, /api/trust/evidence
**Tables used:** governance_policies

**Engine name:** RuntimePolicyEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/governance/runtimePolicyEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** runtime_policies

**Engine name:** BenchmarkEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/benchmarkEngine.ts
**APIs using it:** /api/benchmarks
**Tables used:** sessions, facttic_governance_events, behavior_forensics, incident_responses, governance_benchmarks

**Engine name:** CrossSessionEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/crossSessionEngine.ts
**APIs using it:** /api/intelligence/cross-session
**Tables used:** evaluations, cross_session_patterns

**Engine name:** GovernanceMaturityEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/governanceMaturityEngine.ts
**APIs using it:** /api/governance/maturity
**Tables used:** governance_policies, sessions, drift_alerts, governance_maturity_scores

**Engine name:** ModelConsistencyEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/modelConsistencyEngine.ts
**APIs using it:** /api/intelligence/model-consistency
**Tables used:** model_consistency_tests

**Engine name:** ModelDriftEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/modelDriftEngine.ts
**APIs using it:** /api/drift/models
**Tables used:** model_drift_metrics

**Engine name:** PredictiveDriftEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/predictiveDriftEngine.ts
**APIs using it:** /api/intelligence/predictive-drift, /api/monitor/health
**Tables used:** model_drift_metrics, predictive_drift_events

**Engine name:** RegressionEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/regressionEngine.ts
**APIs using it:** /api/intelligence/regression
**Tables used:** evaluations, regression_signals

**Engine name:** RiskMetricsEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/intelligence/riskMetricsEngine.ts
**APIs using it:** /api/governance/risk-score
**Tables used:** interceptor_events, governance_risk_metrics

**Engine name:** AdvancedTelemetryEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/observability/advancedTelemetryEngine.ts
**APIs using it:** /api/observability/advanced-metrics
**Tables used:** audit_logs, facttic_governance_events, sessions

**Engine name:** PilotAuditEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/pilotAuditEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** interactions, audit_logs

**Engine name:** AIHealthEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/product/aiHealthEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** runtime_intercepts, model_drift, agent_sessions, cost_metrics, ai_health_scores

**Engine name:** SessionReplayEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/replay/sessionReplayEngine.ts
**APIs using it:** /api/replay/session/[id]
**Tables used:** None

**Engine name:** ReplicationEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/replicationEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** None

**Engine name:** ProviderResilienceEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/resilience/providerResilienceEngine.ts
**APIs using it:** /api/resilience/provider-health
**Tables used:** provider_health

**Engine name:** ReviewEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/review/reviewEngine.ts
**APIs using it:** /api/review/assign, /api/review/queue, /api/review/resolve
**Tables used:** review_queue

**Engine name:** RiskScoringEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/riskScoringEngine.ts
**APIs using it:** /api/governance/stream, /api/sessions/[id]/turn, /api/v1/governance/evaluate, /api/webhooks/ingest
**Tables used:** None

**Engine name:** FraudDetectionEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/security/fraudDetectionEngine.ts
**APIs using it:** /api/chat, /api/governance/execute
**Tables used:** facttic_governance_events, api_keys

**Engine name:** ScenarioEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/simulation/scenarioEngine.ts
**APIs using it:** None listed or directly imported
**Tables used:** simulation_runs

**Engine name:** StressTestingEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/testing/stressTestingEngine.ts
**APIs using it:** /api/testing/stress
**Tables used:** stress_test_runs

**Engine name:** VoiceTelemetryEngine
**Purpose:** Analyzed from file content
**Key files:** /lib/voice/telemetryEngine.ts
**APIs using it:** /api/voice/telemetry
**Tables used:** voice_stream_metrics


## STEP 2 — API Surface Map

**Endpoint:** /api/agents/[id]
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/agents/control
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/agents
**Purpose:** Fetches data;
**Tables queried:** agents
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/agents/sessions
**Purpose:** Fetches data;
**Tables queried:** agent_sessions
**Dashboard widgets/pages using it:** /dashboard/agents

**Endpoint:** /api/agents/start
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/agents/step
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/agents

**Endpoint:** /api/alerts
**Purpose:** Fetches data;
**Tables queried:** alerts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/auth/callback
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/auth/signup
**Purpose:** Fetches data; Stores data;
**Tables queried:** organizations, users, org_members, profiles
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/benchmarks
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/billing/record
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/sandbox

**Endpoint:** /api/chat
**Purpose:** Executes governance; Stores data;
**Tables queried:** sessions, session_turns, incidents
**Dashboard widgets/pages using it:** /dashboard/playground

**Endpoint:** /api/compliance/export
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/compliance

**Endpoint:** /api/compliance/ledger
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/compliance/signals
**Purpose:** Fetches data;
**Tables queried:** compliance_signals
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/cost/metrics
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/cron/health
**Purpose:** Executes governance; Stores data;
**Tables queried:** sessions, session_turns
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/cron/prune
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/billing/plan
**Purpose:** Fetches data;
**Tables queried:** billing_summaries
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/billing/usage
**Purpose:** Fetches data;
**Tables queried:** billing_events, cost_metrics, facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/governance/health-timeline
**Purpose:** Fetches data;
**Tables queried:** governance_risk_metrics
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/governance/playground
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/governance/risk-trend
**Purpose:** Fetches data;
**Tables queried:** governance_risk_metrics
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/governance/simulation
**Purpose:** Executes governance; Fetches data;
**Tables queried:** simulation_runs
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/snapshot
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/dashboard/stats
**Purpose:** Fetches data;
**Tables queried:** governance_predictions, governance_alerts, facttic_governance_events, incidents
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/deployment/config
**Purpose:** Fetches data;
**Tables queried:** org_members, deployment_configs
**Dashboard widgets/pages using it:** /dashboard/settings

**Endpoint:** /api/drift/models
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/drift
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/economics/cost-anomalies
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/events
**Purpose:** Fetches data;
**Tables queried:** telemetry_stream
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/evidence/generate
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/reports

**Endpoint:** /api/forensics/analyze
**Purpose:** Analyzes data;
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/forensics/behavior/[sessionId]
**Purpose:** Analyzes data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/forensics/incidents
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/forensics/rca/[sessionId]
**Purpose:** Analyzes data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/forensics/rca-graph/[sessionId]
**Purpose:** Analyzes data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/gateway/ai
**Purpose:** Fetches data;
**Tables queried:** gateway_requests
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/gateway/intercept
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/gateway/route
**Purpose:** Fetches data;
**Tables queried:** routing_metrics
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/generatePDF
**Purpose:** Stores data;
**Tables queried:** report_definitions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/generateReport
**Purpose:** Stores data;
**Tables queried:** report_definitions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/acceleration
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/alerts/config
**Purpose:** Fetches data; Stores data;
**Tables queried:** alert_configs
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/alerts
**Purpose:** Fetches data;
**Tables queried:** governance_alerts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/autonomous/run
**Purpose:** Fetches data;
**Tables queried:** autonomous_actions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/certification
**Purpose:** Fetches data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/composite-health
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/drift
**Purpose:** Fetches data;
**Tables queried:** governance_predictions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/evaluate
**Purpose:** Executes governance;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/execute
**Purpose:** Executes governance; Stores data;
**Tables queried:** sessions, session_turns
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/gdpr-erase
**Purpose:** Fetches data;
**Tables queried:** sessions, org_members
**Dashboard widgets/pages using it:** /dashboard/data-governance

**Endpoint:** /api/governance/guardrail/evaluate
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/intercept
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/intercepts
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/governance/investigations
**Purpose:** Fetches data;
**Tables queried:** governance_alerts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/ledger/integrity
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/ledger
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/reports

**Endpoint:** /api/governance/ledger/verify
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/maturity
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/reports

**Endpoint:** /api/governance/metrics
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/momentum
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/policies/archive
**Purpose:** Fetches data;
**Tables queried:** governance_policies
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/policies/create
**Purpose:** Fetches data; Stores data;
**Tables queried:** governance_policies
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/policies
**Purpose:** Fetches data;
**Tables queried:** governance_policies
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/policies/update
**Purpose:** Fetches data;
**Tables queried:** governance_policies
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/policy/evaluate
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/projection
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/replay
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/reports/generate
**Purpose:** Fetches data; Stores data;
**Tables queried:** report_definitions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/respond
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/review/assign
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/review/resolve
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/reviews
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/risk-score
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/sessions/[sessionId]/turns
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/sessions
**Purpose:** Fetches data;
**Tables queried:** sessions
**Dashboard widgets/pages using it:** /dashboard/replay

**Endpoint:** /api/governance/snapshot
**Purpose:** Fetches data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/state
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/stream
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/timeline/[sessionId]
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/timeline
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events, forensic_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/timeseries
**Purpose:** Fetches data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/trend
**Purpose:** Fetches data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/verify
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/governance/verify-evaluation
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/health
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/integrations/connect
**Purpose:** Stores data;
**Tables queried:** ai_connections
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/integrations/elevenlabs/webhook
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/integrations/retell/webhook
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/integrations/status
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/integrations/vapi/webhook
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/intelligence/cross-session
**Purpose:** Analyzes data;
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/intelligence/hallucination-risk
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/intelligence/model-consistency
**Purpose:** Executes governance;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/intelligence/predictive-drift
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/intelligence/regression
**Purpose:** Executes governance;
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/internal/demo-provision
**Purpose:** Fetches data; Stores data;
**Tables queried:** organizations, audit_logs
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/internal/test-org
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/ledger/verify
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/metrics
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/models/behavior
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/monitor/health
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/monitoring/sentry-test
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/network/intelligence
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/network/signal
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/intelligence

**Endpoint:** /api/observability/advanced-metrics
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/observability

**Endpoint:** /api/observability/governance-stream
**Purpose:** Fetches data;
**Tables queried:** org_members, facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/observability/metrics
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events, governance_alerts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/observability/stream
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/advanced

**Endpoint:** /api/org/create
**Purpose:** Fetches data; Stores data;
**Tables queried:** organizations
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/policies/runtime/[id]
**Purpose:** Fetches data;
**Tables queried:** runtime_policies
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/policies/runtime
**Purpose:** Fetches data; Stores data;
**Tables queried:** org_members, runtime_policies
**Dashboard widgets/pages using it:** /dashboard/advanced

**Endpoint:** /api/product/overview
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/home

**Endpoint:** /api/replay/session/[id]
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/request-access
**Purpose:** Stores data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/resilience/dr-status
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/resilience/provider-health
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/revenue/readiness
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/review/assign
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/review/queue
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/review/resolve
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/review

**Endpoint:** /api/runtime/intercept
**Purpose:** Fetches data;
**Tables queried:** org_members, runtime_intercepts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/security/key-rotate
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/security/session-integrity/[sessionId]
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/sessions/[id]/finalize
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/sessions/[id]
**Purpose:** Fetches data;
**Tables queried:** sessions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/sessions/[id]/timeline
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events, org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/sessions/[id]/turn
**Purpose:** Stores data;
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/sessions
**Purpose:** Fetches data;
**Tables queried:** sessions
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/setup/sync-user
**Purpose:** Fetches data; Stores data;
**Tables queried:** users, org_members, organizations, profiles
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/simulation/run
**Purpose:** Executes governance;
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/simulation

**Endpoint:** /api/simulator/run
**Purpose:** Fetches data; Stores data;
**Tables queried:** org_members, simulation_runs
**Dashboard widgets/pages using it:** /dashboard/advanced

**Endpoint:** /api/strategic/risk-projection
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/system/health
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events, governance_alerts
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/system/metrics
**Purpose:** Fetches data;
**Tables queried:** facttic_governance_events, governance_alerts, incidents
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/system/report
**Purpose:** Executes governance; Fetches data;
**Tables queried:** sessions, incidents
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/telemetry/signed
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/sandbox

**Endpoint:** /api/testing/run
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/advanced

**Endpoint:** /api/testing/simulate
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/testing/stress
**Purpose:** Executes governance;
**Tables queried:** None
**Dashboard widgets/pages using it:** /dashboard/testing

**Endpoint:** /api/trust/auditor-access
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/trust/compliance
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/trust/evidence
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/trust/proof
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/trust/public-summary
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/users/[id]/role
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/users/invite
**Purpose:** Fetches data; Stores data;
**Tables queried:** users, org_members, profiles
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/users
**Purpose:** Fetches data;
**Tables queried:** org_members, profiles
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/v1/governance/evaluate
**Purpose:** Fetches data;
**Tables queried:** api_keys
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/voice/conversations/[id]
**Purpose:** Fetches data;
**Tables queried:** sessions, session_turns
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/voice/ingest
**Purpose:** Fetches data; Stores data;
**Tables queried:** memberships, facttic_governance_events
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/voice/riskScores
**Purpose:** API Route handler
**Tables queried:** None
**Dashboard widgets/pages using it:** Unknown/Server Components

**Endpoint:** /api/voice/telemetry
**Purpose:** Fetches data;
**Tables queried:** org_members
**Dashboard widgets/pages using it:** /dashboard/voice

**Endpoint:** /api/webhooks/ingest
**Purpose:** Stores data;
**Tables queried:** session_turns
**Dashboard widgets/pages using it:** Unknown/Server Components


## STEP 3 — Database Capability Audit

**Table name:** agents
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/agents

**Table name:** agent_sessions
**Purpose:** Observability / Telemetry
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/agents/sessions

**Table name:** alerts
**Purpose:** Alerts / Incident Management
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/alerts

**Table name:** organizations
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/auth/signup, /api/internal/demo-provision, /api/org/create, /api/setup/sync-user

**Table name:** users
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/auth/signup, /api/setup/sync-user, /api/users/invite

**Table name:** org_members
**Purpose:** Operational datastore
**Pages using it:** /dashboard/incidents/[session_id], /dashboard/incidents, /dashboard/profile
**APIs writing/reading to it:** /api/auth/signup, /api/benchmarks, /api/cost/metrics, /api/deployment/config, /api/drift/models, /api/economics/cost-anomalies, /api/governance/gdpr-erase, /api/governance/intercept, /api/governance/intercepts, /api/governance/ledger/integrity, /api/governance/ledger, /api/governance/ledger/verify, /api/governance/policy/evaluate, /api/governance/respond, /api/observability/governance-stream, /api/observability/stream, /api/policies/runtime, /api/review/assign, /api/review/queue, /api/review/resolve, /api/runtime/intercept, /api/sessions/[id]/timeline, /api/setup/sync-user, /api/simulator/run, /api/testing/run, /api/users/[id]/role, /api/users/invite, /api/users, /api/voice/telemetry

**Table name:** profiles
**Purpose:** Operational datastore
**Pages using it:** /dashboard/profile
**APIs writing/reading to it:** /api/auth/signup, /api/setup/sync-user, /api/users/invite, /api/users

**Table name:** sessions
**Purpose:** Observability / Telemetry
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/chat, /api/cron/health, /api/governance/execute, /api/governance/gdpr-erase, /api/governance/sessions, /api/sessions/[id], /api/sessions, /api/system/report, /api/voice/conversations/[id]

**Table name:** session_turns
**Purpose:** Observability / Telemetry
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/chat, /api/cron/health, /api/governance/execute, /api/voice/conversations/[id], /api/webhooks/ingest

**Table name:** incidents
**Purpose:** Alerts / Incident Management
**Pages using it:** /dashboard/incidents
**APIs writing/reading to it:** /api/chat, /api/dashboard/stats, /api/system/metrics, /api/system/report

**Table name:** facttic_governance_events
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/compliance/ledger, /api/dashboard/billing/usage, /api/dashboard/governance/playground, /api/dashboard/snapshot, /api/dashboard/stats, /api/governance/sessions/[sessionId]/turns, /api/governance/timeline/[sessionId], /api/governance/timeline, /api/observability/governance-stream, /api/observability/metrics, /api/sessions/[id]/timeline, /api/system/health, /api/system/metrics, /api/voice/ingest

**Table name:** compliance_signals
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/compliance/signals

**Table name:** billing_summaries
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/billing/plan

**Table name:** billing_events
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/billing/usage

**Table name:** cost_metrics
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/billing/usage

**Table name:** governance_risk_metrics
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/governance/health-timeline, /api/dashboard/governance/risk-trend

**Table name:** simulation_runs
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/governance/simulation, /api/simulator/run

**Table name:** governance_predictions
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/stats, /api/governance/drift

**Table name:** governance_alerts
**Purpose:** Alerts / Incident Management
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/dashboard/stats, /api/governance/alerts, /api/governance/investigations, /api/observability/metrics, /api/system/health, /api/system/metrics

**Table name:** deployment_configs
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/deployment/config

**Table name:** telemetry_stream
**Purpose:** Observability / Telemetry
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/events

**Table name:** gateway_requests
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/gateway/ai

**Table name:** routing_metrics
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/gateway/route

**Table name:** report_definitions
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/generatePDF, /api/generateReport, /api/governance/reports/generate

**Table name:** alert_configs
**Purpose:** Alerts / Incident Management
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/governance/alerts/config

**Table name:** autonomous_actions
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/governance/autonomous/run

**Table name:** governance_policies
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/governance/policies/archive, /api/governance/policies/create, /api/governance/policies, /api/governance/policies/update

**Table name:** forensic_events
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/governance/timeline

**Table name:** ai_connections
**Purpose:** Operational datastore
**Pages using it:** /dashboard/connect, /dashboard/observability
**APIs writing/reading to it:** /api/integrations/connect

**Table name:** audit_logs
**Purpose:** Operational datastore
**Pages using it:** /dashboard/advanced
**APIs writing/reading to it:** /api/internal/demo-provision

**Table name:** runtime_policies
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/policies/runtime/[id], /api/policies/runtime

**Table name:** runtime_intercepts
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/runtime/intercept

**Table name:** api_keys
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/v1/governance/evaluate

**Table name:** memberships
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** /api/voice/ingest

**Table name:** facttic_incidents
**Purpose:** Alerts / Incident Management
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** evaluations
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** cost_anomalies
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** model_behavior
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** behavior_forensics_signals
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** data_retention_policies
**Purpose:** Operational datastore
**Pages using it:** /dashboard/data-governance
**APIs writing/reading to it:** None

**Table name:** gdpr_erasure_requests
**Purpose:** Operational datastore
**Pages using it:** /dashboard/data-governance
**APIs writing/reading to it:** None

**Table name:** regression_signals
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** interceptor_events
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** behavior_forensics
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** incident_responses
**Purpose:** Alerts / Incident Management
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** governance_benchmarks
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** cross_session_patterns
**Purpose:** Observability / Telemetry
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** drift_alerts
**Purpose:** AI Drift Detection
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** governance_maturity_scores
**Purpose:** Governance data layer
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** model_consistency_tests
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** model_drift_metrics
**Purpose:** AI Drift Detection
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** predictive_drift_events
**Purpose:** AI Drift Detection
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** interactions
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** model_drift
**Purpose:** AI Drift Detection
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** ai_health_scores
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** provider_health
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** review_queue
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** stress_test_runs
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None

**Table name:** voice_stream_metrics
**Purpose:** Operational datastore
**Pages using it:** Backend only
**APIs writing/reading to it:** None


## STEP 4 — Dashboard Capability Audit

**Page:** /dashboard/advanced
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Terminal, Activity, Play, ShieldAlert, SlidersHorizontal, Plus, Save, Server, ClipboardList, RefreshCw, Wifi, WifiOff, Plug, Copy, Skeleton, CardSkeleton, ChartSkeleton, EmptyState

**Tables used directly (client-side):** audit_logs
**APIs used (fetch):** /api/simulator/run, /api/policies/runtime, /api/observability/stream, /api/testing/run

**Page:** /dashboard/agents
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Bot, Activity, Zap, LayoutGrid, Terminal, GitCommitHorizontal, ShieldAlert, Play, ShieldX, PolarGrid, PolarAngleAxis, Radar, Tooltip, Cpu
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/agents/step, /api/agents/sessions

**Page:** /dashboard/alerts
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/analysis
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Icon, DashboardFilters, CustomTabs, EvaluationAnalysis
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/behavior-forensics
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Fingerprint, Cpu, ArrowUpRight, Layers
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/governance/sessions?limit=10&high_risk=true

**Page:** /dashboard/billing
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** CreditCard, CheckCircle, History, Download, Shield, BillingCycleToggle, PricingSelector
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/chat
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/compliance/export
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldCheck, FileDown, Database, Clock, ExternalLink, History, Download
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/compliance
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldCheck, RefreshCw, Calendar, CartesianGrid, XAxis, YAxis, Tooltip, Line, Cell, Fingerprint, ShieldAlert
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/compliance/signals?limit=50, /api/compliance/ledger?limit=50, /api/compliance/export

**Page:** /dashboard/connect
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Bot, Server, Activity, ShieldCheck, Plus, RefreshCw, Clock
**Tables used directly (client-side):** ai_connections
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/data-governance
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldCheck, Clock, AlertTriangle, CheckCircle, XCircle
**Tables used directly (client-side):** data_retention_policies, gdpr_erasure_requests
**APIs used (fetch):** /api/governance/gdpr-erase

**Page:** /dashboard/forensics
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** RefreshCw, Terminal, Database, Search, ExternalLink, ForensicsTimeline, RcaGraph, BehaviorAnomalySignals
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/governance/sessions?limit=10&high_risk=true

**Page:** /dashboard/gateway
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Zap, GitBranch
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/governance
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ChevronRight, RefreshCw, Shield, Activity, TrendingUp, DollarSign, Target, SimulationWidget, GovernanceHealthTimeline, AlertTriangle, Clock, Terminal
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/governance-maturity
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Trophy, TrendingUp, Hexagon, ChevronRight, Info
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/home
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Shield, LayoutGrid, PillarCard
, Activity, CartesianGrid, XAxis, YAxis, Tooltip, Area, ArrowRight
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/product/overview

**Page:** /dashboard/incidents/[session_id]
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ChevronLeft, ShieldAlert, GovernanceStory, IncidentTimeline
**Tables used directly (client-side):** org_members
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/incidents
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldAlert, IncidentControls
**Tables used directly (client-side):** org_members, incidents
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/intelligence
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ComingSoonBlock, Activity, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cpu, ShieldAlert, BrainCircuit, Area, TrendingDown, Line, Search, RadialBar, Fingerprint, AlertTriangle, LiveInterceptsPanel, TrendingUp, RefreshCw, Tooltip
, Line
, Mic, ShieldX, Icon, Globe, Zap, Cell, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Bot, Gauge, Network, Radar
, GitBranch, ZAxis
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/intelligence/cross-session, /api/intelligence/regression, /api/forensics/analyze, /api/drift/models, /api/drift/models?seed=true, /api/governance/intercepts, /api/network/signal, /api/network/intelligence, /api/gateway/route

**Page:** /dashboard/investigations
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/observability
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Activity, ArrowUpRight, MonitorDot, PieChart
**Tables used directly (client-side):** ai_connections
**APIs used (fetch):** /api/observability/advanced-metrics

**Page:** /dashboard/organization
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Skeleton, CardSkeleton, ChartSkeleton, TableSkeleton, DashboardFilters, ExecutiveHealthCard, DriftTrendCard, ActiveAlertsCard, RiskBreakdownCard, GovernanceStateCard, VoiceDriftCard, IntelligenceDashboard, RecentInvestigationsCard
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/playground
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldCheck, Info, PromptRunner, GovernanceResults
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/chat

**Page:** /dashboard/profile
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Shield, User, Mail, Building, Clock, Fingerprint, Briefcase, Save
**Tables used directly (client-side):** org_members, profiles
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/replay
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** RefreshCw, Clock, ReplayViewer
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/governance/sessions

**Page:** /dashboard/reports
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** RefreshCw, Activity, Trophy, Cpu, ScoreBar, Target, Icon, FileText, ShieldCheck, Download, DollarSign, XAxis, YAxis, Bar, Line
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/governance/maturity, /api/governance/ledger, /api/evidence/generate

**Page:** /dashboard/review
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Clock, User, AlertTriangle, XCircle, Activity, Zap, RefreshCw, Shield, ChevronRight
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/review/resolve

**Page:** /dashboard/reviews
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ShieldAlert, Search, Filter, Users, MessageSquare, MoreVertical
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/sandbox
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ComingSoonBlock
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/telemetry/signed, /api/billing/record

**Page:** /dashboard/sessions/[id]
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** ViewModeToggle, SessionRadar, RiskDistributionChart, DriftIndicator
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/settings/access
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/settings/integrations
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/settings
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Cloud, Shield, Server, RefreshCw, Check, ChevronDown, Save
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/deployment/config

**Page:** /dashboard/settings/sso
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Native HTML/Components without specific custom names
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/settings/tenant
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** History, Save, Globe, Box, RotateCcw
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/simulation
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** PlayCircle, Database, ScenarioSelector, Terminal, History
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/simulation/run

**Page:** /dashboard/testing
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Thermometer, Zap, Layers, Clock, RotateCcw, Play, Activity, AlertTriangle
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/testing/stress

**Page:** /dashboard/trust
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Shield, Activity, EyeOff, Database, CheckCircle, Fingerprint, Lock, UserCheck, Scale, FileText
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/usage
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Activity, ArrowUpRight
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/voice/[conversationId]
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Skeleton, CountUp
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** None / Server Actions

**Page:** /dashboard/voice
**Capabilities exposed:** Renders UI components for platform capabilities.
**Widgets:** Mic, RefreshCw, PhoneCall, ExternalLink, ShieldCheck
**Tables used directly (client-side):** None (uses APIs)
**APIs used (fetch):** /api/voice/telemetry, /api/governance/sessions?limit=20


## STEP 5 — Feature Detection

**Root Cause Analysis (RCA):** YES
**Hallucination detection:** PARTIAL
**Sentiment / tone analysis:** NO
**CI regression testing:** PARTIAL
**Conversation simulation:** NO
**Load testing:** PARTIAL
**Voice monitoring:** YES
**Live transcript:** PARTIAL
**Production monitoring:** YES
**Alerts & notifications:** YES
**Session replay:** YES
**Exportable reports:** YES
**RBAC / SSO:** YES
**PII redaction:** YES
**Compliance signals:** YES
**Self-host support:** NO
**Sandbox environment:** YES

## STEP 6 — Product Layer Classification

**AI Governance:** Strong
**AI Observability:** Strong
**AI Forensics:** Strong
**Testing Platform:** Partial
**Compliance Platform:** Partial
**Security Platform:** Missing
**Billing Platform:** Strong

## STEP 7 — Product Readiness Score

**Architecture:** 8/10
**Feature completeness:** 7/10
**Enterprise readiness:** 6/10
**Observability maturity:** 9/10
**Governance maturity:** 8/10

## STEP 8 — Missing Product Layers

Based on the audit, identify the critical missing layers required for a real enterprise AI product:
- **Human review workflow:** Present partially in 'reviewQueue.ts' and /review pages, but needs robust resolution tracking and assignment modeling.
- **Evaluation framework:** Lacks systematic prompt evaluation, golden datasets testing platform vs mere simulation.
- **SDK integration layer:** Node.js/Python SDK repositories missing or not tightly bound within system metrics (mostly rest endpoints visible).
- **Enterprise SSO Integration (SAML/Okta):** 'ssoMapper.ts' exists but deeply lacks SAML config tables or mapping pipelines in the database schema.
