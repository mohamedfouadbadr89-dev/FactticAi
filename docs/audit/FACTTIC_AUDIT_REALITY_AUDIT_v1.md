# FACTTIC WEB REALITY AUDIT

**Auditor:** Platform Runtime Auditor (Antigravity)
**Status:** PARTIALLY WIRED
**System Reality Score:** 64/100

---

## 1. Engine Runtime Status
| Engine | Runtime Status | Runtime Connectivity |
| :--- | :--- | :--- |
| **AiInterceptorKernel** | ACTIVE | Invoked by `POST /api/governance/evaluate` |
| **PolicyEngine** | ACTIVE | Invoked by `POST /api/governance/evaluate` |
| **GuardrailEngine** | ACTIVE | Invoked by `POST /api/governance/evaluate` |
| **GovernanceStateEngine** | ACTIVE | Invoked by `POST /api/governance/evaluate` |
| **GovernancePipeline** | **PASSIVE** | Exists in code (v4.3) but **BYPASSED** by API routes |
| **ModelDriftEngine** | ACTIVE | Connected to `/api/drift/models` |
| **PredictiveDriftEngine** | ACTIVE | Connected to `/api/intelligence/predictive-drift` |
| **RiskMetricsEngine** | ACTIVE | Invoked by `POST /api/governance/evaluate` |
| **RcaGraphEngine** | **ORPHAN** | Implemented but has no UI entry point |
| **BehaviorForensicsEngine** | ACTIVE | Invoked via `RiskMetricsEngine` |
| **CostAnomalyEngine** | ACTIVE | Invoked via `RiskMetricsEngine` |
| **ComplianceIntelligenceEngine**| **ORPHAN** | Exists in code but not connected to API/UI |
| **EvidenceExportEngine** | ACTIVE | Connected to `/api/compliance/export` |
| **AlertEngine** | **ORPHAN** | Implementation exists but never triggered in runtime |

## 2. API Operational Status
- **POST /api/governance/evaluate**: **FUNCTIONAL** but bypasses the `GovernancePipeline` orchestration logic.
- **GET /api/governance/state**: **FUNCTIONAL**.
- **GET /api/governance/alerts**: **FUNCTIONAL** (connects to DB).
- **POST /api/compliance/export**: **FUNCTIONAL**.
- **POST /api/testing/stress**: **FUNCTIONAL** (Engine connected).
- **POST /api/simulation/run**: **FUNCTIONAL** (Engine connected).

## 3. Database Activity Map
| Table Name | Activity Level | Issues |
| :--- | :--- | :--- |
| `governance_event_ledger` | **ACTIVE** | Core sequential ledger is receiving events |
| `governance_policies` | **ACTIVE** | Policy configuration is live |
| `interceptor_events` | **ACTIVE** | Telemetry is being recorded |
| `governance_risk_metrics` | **MISSING** | **REALITY GAP**: Target table does not exist in public schema |
| `governance_alerts` | **MISSING** | **REALITY GAP**: Target table does not exist in public schema |
| `model_drift_metrics` | **MISSING** | **REALITY GAP**: Target table does not exist in public schema |
| `compliance_signals` | **UNUSED** | Exists with 0 rows |
| `cost_anomalies` | **UNUSED** | Exists with 0 rows |

## 4. Dashboard Integration
- **/dashboard/governance**: **FULLY OPERATIONAL**. Consumes real API data.
- **/dashboard/compliance**: **ARCHITECTURE ONLY**. Relies on **MOCK DATA** within the component logic.
- **/dashboard/forensics**: **DEAD**. UI page does not exist.
- **/dashboard/testing**: **FULLY OPERATIONAL**. Triggers real stress tests.
- **/dashboard/simulation**: **FULLY OPERATIONAL**. Triggers real scenario runs.

## 5. Runtime Pipeline Validation
> [!WARNING]
> **PIPELINE BYPASS DETECTED**
> The sophisticated `GovernancePipeline` (which includes residency checks, residency locks, and deterministic hashing) is currently bypassed by the `evaluate` API route. The API manually calls engines, losing the safety guarantees of the v4.3 Pipeline.

## 6. Dead Components
1. **ComplianceIntelligenceEngine**: Isolated in code, no runtime invocation.
2. **GovernanceAlertEngine**: Not wired into the evaluation results path.
3. **Forensics Dashboard**: Missing UI implementation despite engine readiness.

## 7. Reality Gap Summary
The system exhibits a "Code-Forward" gap. While the architectural documentation and deep logic (v4.3 Pipeline) are highly advanced, the **Runtime Implementation** uses a simplified "Shadow Path." 
- **The Good**: Real-time interceptors and risk calculated via multiple engines.
- **The Bad**: Database schema is out of sync with engine persistence requirements.
- **The Ugly**: Compliance layer is currently a visual placeholder (Mock data).

---

## Final Classification
> [!IMPORTANT]
> **PARTIALLY WIRED**
> Facttic is functionally capable of basic governance, but the "Platform Reality" is significantly trailing the "Architectural Readiness." Immediate focus is required on Database-Engine synchronization and Pipeline re-integration.
