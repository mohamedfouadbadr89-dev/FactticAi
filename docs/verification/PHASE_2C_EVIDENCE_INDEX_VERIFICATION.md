# PHASE 2C – EVIDENCE INDEX

This document catalogues the visual evidence required for the institutional audit of Phase 2C (Auth Foundation) for Facttic.ai.

## Evidence Directory
**Path**: `/evidence/phase_2c/`

## Index of Proof

| Reference ID | Filename | Description |
|--------------|----------|-------------|
| **AUTH_01** | `dashboard_authenticated.png` | Verification of authenticated session active on the Executive Dashboard. |
| **AUTH_02** | `02_auth_me_200.png` | Network log showing successful `200 OK` response from `/api/auth/me` with session metadata. |
| **RLS_01** | `rls_sessions.png` | Database schema audit confirming RLS is active on `public.sessions` table. |
| **RLS_02** | `rls_session_turns.png` | Database schema audit confirming RLS is active on `public.session_turns` table. |
| **ENG_01** | `rpc_definition.png` | Source code audit of `compute_executive_state` showing `SECURITY DEFINER` property. |
| **ANLT_01** | `sql_avg_30d.png` | SQL execution proof for 30-day aggregate health computation. |
| **ANLT_02** | `sql_last7.png` | SQL execution proof for current 7-day risk computation window. |
| **ANLT_03** | `sql_prev7.png` | SQL execution proof for previous 7-day risk computation window (baseline). |
| **ANLT_04** | `sql_isolation.png` | SQL validation result showing zero cross-org row leaks (Isolation Verification). |

---
*This index is part of the formal PHASE 2C VALIDATION protocol.*
