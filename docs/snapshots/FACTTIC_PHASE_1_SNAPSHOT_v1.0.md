# FACTTIC PHASE 1 SNAPSHOT v1.0
**System**: FACTTIC.AI Governance Core  
**Version**: v1.0.0 (Baseline)  
**Environment**: Production  
**Status**: FROZEN  

---

## 1. ARCHITECTURE SUMMARY
The FACTTIC.AI Governance Core is a deterministic risk-attribution engine that provides real-time oversight of AI operations. Phase 1 establishes the foundational database schema, RLS isolation policies, and the core risk scoring logic.

### Key Components
- **Risk Scoring Engine**: Deterministic scalar aggregation of telemetry factors.
- **Trace Engine**: Forensic event logging and RCA attribution.
- **Sovereign Context**: Org-scoped data isolation enforced at the database tier.

---

## 2. SUPABASE SCHEMA SNAPSHOT
The following tables form the core architectural baseline:

| Table | Purpos | RLS Policy |
| :--- | :--- | :--- |
| `organizations` | Identity root | Static |
| `org_members` | Admission control | Scoped by auth.uid() |
| `evaluations` | Forensic risk records | org_id Scoped |
| `sessions` | Interaction root | org_id Scoped |
| `session_turns` | Granular telemetry | org_id Scoped |

---

## 3. FUNCTION REGISTRY
Core database logic is encapsulated in the following hardened RPCs:

- `public.compute_executive_state(p_org_id uuid)`: (SECURITY DEFINER) Aggregates session telemetry.
- `public.create_session(p_org_id uuid, p_agent_id uuid)`: Initializes interaction tracking.
- `public.insert_session_turn(...)`: Records and scores individual interaction steps.
- `public.finalize_session(...)`: Closes session and persists final risk state.

---

## 4. ROW-LEVEL SECURITY (RLS) SUMMARY
All core telemetry tables (`evaluations`, `sessions`, `session_turns`) are protected by `ENABLE ROW LEVEL SECURITY`. Access is strictly limited to authenticated members of the respective `org_id` through direct join lookups on `public.org_members`.

---

## 5. STREAM VALIDATION PROOF
Verified the `/api/governance/stream` SSE endpoint for real-time telemetry delivery.
- **Handshake**: `CONNECTED` event received with signed `org_id`.
- **Payload**: `RISK_UPDATE` events successfully streamed on state changes.
- **Persistence**: SSE connection survives client-side route transitions.

---

## 6. DRIFT VALIDATION PROOF
Verified the Drift calculation logic in `compute_executive_state`:
- **Algorithm**: `ABS(AVG(risk[last_7_days]) - AVG(risk[previous_7_days]))`.
- **Outcome**: The engine correctly detects temporal anomalies in risk variance.
- **Evidence**: Mathematical consistency verified against raw SQL turn data.

---

## 7. FINAL BASELINE DECLARATION

**BASELINE**: FACTTIC_CORE_v1.0.0  
**STATUS**: FROZEN  

No structural changes to core governance logic or database schema are permitted without a formal version bump and audit review.

**STATUS: PHASE 1 CLOSED**
