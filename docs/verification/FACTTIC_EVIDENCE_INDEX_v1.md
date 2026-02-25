# FACTTIC EVIDENCE INDEX v1.0

This document catalogues the visual evidence for all verified components across Phase 1, 2B, and 2C.

---

## DIRECTORY STRUCTURE
- `/evidence/phase_1/`: Core database and engine validation artifacts.
- `/evidence/phase_2b/`: Executive state and aggregation proofs.
- `/evidence/phase_2c/`: Authentication and real session enforcement logs.

---

## PHASE 1: CORE ENGINE & DB
| ID | Filename | Description |
| :--- | :--- | :--- |
| **P1_01** | `evaluations_schema.png` | Verification of restored `evaluations` table. |
| **P1_02** | `rls_isolation_proof.pdf` | SQL query log showing cross-org leakage = 0. |
| **P1_03** | `determinism_triplicate.png` | Console output showing 3 identical risk scores for 3 identical inputs. |

---

## PHASE 2B: EXECUTIVE STATE
| ID | Filename | Description |
| :--- | :--- | :--- |
| **P2B_01** | `sql_avg_30d.png` | SQL proof for rolling 30-day health window. |
| **P2B_02** | `sql_last7.png` | SQL proof for current 7-day risk window. |
| **P2B_03** | `sql_prev7.png` | SQL proof for baseline (previous 7-day) window. |
| **P2B_04** | `drift_dashboard.png` | Dashboard rendering of calculated drift and risk state. |

---

## PHASE 2C: AUTH FOUNDATION
| ID | Filename | Description |
| :--- | :--- | :--- |
| **P2C_01** | `dashboard_authenticated.png` | Protected dashboard visible with active session. |
| **P2C_02** | `02_auth_me_200.png` | `/api/auth/me` returning authenticated identity. |
| **P2C_03** | `rls_sessions.png` | Confirming RLS active on `public.sessions`. |
| **P2C_04** | `rls_session_turns.png` | Confirming RLS active on `public.session_turns`. |

---
**INDEX_VERSION: v1.0.0**
