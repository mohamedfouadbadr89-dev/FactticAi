# EVIDENCE INDEX v1.0
**Phase**: 1  
**Root Directory**: `/evidence/phase_1/`  

---

## 1. CORE ENGINE VALIDATION

| Asset Reference | Validation Purpose | Criterion |
| :--- | :--- | :--- |
| `/evidence/phase_1/deterministic_repeat_proof.png` | **Deterministic Repeat Proof** | Verification that identical payloads yield identical risk scores. |
| `/evidence/phase_1/risk_summation_match.png` | **Factor Summation** | Proof that the sum of individual factor weights matches total risk. |
| `/evidence/phase_1/engine_fail_closed.png` | **Fail-Closed Logic** | Proof that invalid requests yield a null risk response. |

---

## 2. GOVERNANCE INTERFACE PROOF

| Asset Reference | Validation Purpose | Criterion |
| :--- | :--- | :--- |
| `/evidence/phase_1/sse_stream_proof.png` | **Stream Proof** | Evidence of real-time `RISK_UPDATE` delivery via EventSource. |
| `/evidence/phase_1/drift_dashboard_render.png` | **Drift Proof** | Visual verification of successful drift computation on the dashboard. |
| `/evidence/phase_1/aggregation_query.png` | **SQL Aggregation** | Proof of correct health derivation from 30-day temporal windows. |

---

## 3. DATABASE INTEGRITY

| Asset Reference | Validation Purpose | Criterion |
| :--- | :--- | : :--- |
| `/evidence/phase_1/evaluations_schema.png` | **Schema Verification** | Structural proof of the restored `evaluations` table. |
| `/evidence/phase_1/rls_isolation_logs.png` | **Isolation Verification** | Proof of zero-row leakage across organizational boundaries. |

---
**INDEX STATUS: VERIFIED**
