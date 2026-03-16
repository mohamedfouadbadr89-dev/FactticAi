# FACTTIC PLATFORM — FULL SYSTEM ARCHITECTURE AUDIT

**Date:** 2026-03-07
**Auditor:** Principal Software Architect
**Status:** READ-ONLY ANALYSIS — NO MODIFICATIONS MADE
**Scope:** Full reverse engineering of the entire Facttic AI Governance Platform

---

## TABLE OF CONTENTS

1. Project Overview
2. Full File Tree Summary
3. Navigation Map
4. Dashboard Page Inventory (23 pages)
5. Full Page Dissection (per page)
6. API Route Inventory (100+ routes)
7. Database Table Discovery
8. System Pipeline Analysis
9. Data Flow Map
10. Broken Feature Detection
11. Final Architecture Summary

---

## 1. PLATFORM OVERVIEW

Facttic is an **AI Governance Control Layer** — a SaaS platform that sits between enterprise clients and their AI providers (OpenAI, Anthropic, ElevenLabs, Retell, Vapi, Bland) to:

- Intercept and evaluate every AI prompt in real-time
- Enforce governance policies (jailbreak detection, PII, data exfiltration, hallucination)
- Score risk on every interaction
- Persist an immutable evidence ledger with cryptographic hash chains
- Provide enterprise dashboards for compliance, forensics, incident management, and billing

**Stack:**
- Next.js 15 App Router (TypeScript)
- Supabase (Postgres + Auth + Realtime)
- Recharts (visualization)
- Framer Motion (animations)
- Zustand (store: interactionMode)

---

## 2. FILE TREE SUMMARY

| Directory | File Count | Purpose |
|---|---|---|
| `app/` | 201 files | Pages, API routes, layouts |
| `lib/` | 166 files | Engines, services, integrations |
| `components/` | 95 files | UI components |
| `hooks/` | 3 files | Custom React hooks |
| `config/` | 6 files | Navigation, pricing, providers |
| `store/` | 1 file | Zustand interaction mode |
| `supabase/migrations/` | 66 files | DB schema (SQL) |
| **TOTAL** | **538 files** | |

---

## 3. NAVIGATION MAP

### Topbar (EnterpriseTopbar.tsx)

| Element | Type | Action |
|---|---|---|
| Org Selector | Display (static) | Shows "Facttic Systems Inc." — hardcoded |
| Chat/Voice Toggle | Button | Sets `interactionMode` in Zustand store |
| Global Search | Component | `GlobalSearch.tsx` — command palette |
| Audit Mode | Button | Toggles `AuditModeOverlay` (localStorage persist) |
| Theme Toggle | Button | `ThemeToggle.tsx` |
| Help | Button | Icon only — no action connected |
| Health | Display | Hardcoded `CountUp value={84}` — not live |
| Sign Out | Button | Calls `router.push("/")` — auth DISABLED, mock logout |

### Left Sidebar (DashboardSidebar.tsx)

Navigation is defined in `config/navigation.ts` and rendered dynamically. Sign Out calls `supabase.auth.signOut()` → `/login`.

```
OVERVIEW
  Dashboard                → /dashboard
  Executive Overview       → /dashboard/home
  Trust Center             → /dashboard/trust

SETUP
  Connect AI               → /dashboard/connect
  Policies                 → /dashboard/governance
  Guardrails               → /dashboard/intelligence

MONITORING
  Live Monitor             → /dashboard/observability
  Drift Intelligence       → /dashboard/compliance
  Alerts                   → /dashboard/alerts

ANALYTICS
  Reports                  → /dashboard/reports
  Forensics                → /dashboard/forensics
  Incidents                → /dashboard/incidents

FORENSICS
  Investigations           → /dashboard/investigations
  Session Replay           → /dashboard/replay

TESTING
  Simulation Lab           → /dashboard/simulation
  Stress Testing           → /dashboard/testing
  Governance Playground    → /dashboard/playground

INTEGRATIONS
  AI Providers             → /dashboard/agents
  Webhooks                 → /dashboard/settings/integrations

FINANCE
  Usage                    → /dashboard/usage
  Billing                  → /dashboard/billing

SYSTEM
  Access Control           → /dashboard/settings/access
  Settings                 → /dashboard/settings
  Profile                  → /dashboard/profile
```

**Note:** These pages exist in the file system but are NOT in the navigation config:
- `/dashboard/voice` (hidden)
- `/dashboard/sessions/[id]` (hidden)
- `/dashboard/behavior-forensics` (hidden)
- `/dashboard/analysis` (hidden)
- `/dashboard/advanced` (hidden)
- `/dashboard/organization` (hidden)
- `/dashboard/sandbox` (hidden)
- `/dashboard/review` / `/dashboard/reviews` (hidden)
- `/dashboard/data-governance` (hidden)
- `/dashboard/gateway` (hidden)
- `/dashboard/governance-maturity` (hidden)
- `/dashboard/chat` (hidden)
- `/dashboard/incidents/[session_id]` (hidden sub-page)

---

## 4. DASHBOARD PAGE INVENTORY

| # | URL | File | Type | Status |
|---|---|---|---|---|
| 1 | `/dashboard` | `app/dashboard/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 2 | `/dashboard/home` | `app/dashboard/home/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 3 | `/dashboard/trust` | `app/dashboard/trust/page.tsx` | Client | STATIC — FULLY WORKING |
| 4 | `/dashboard/connect` | `app/dashboard/connect/page.tsx` | Client | FUNCTIONAL |
| 5 | `/dashboard/governance` | `app/dashboard/governance/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 6 | `/dashboard/intelligence` | `app/dashboard/intelligence/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 7 | `/dashboard/observability` | `app/dashboard/observability/page.tsx` | Client | BROKEN (realtime dead) |
| 8 | `/dashboard/compliance` | `app/dashboard/compliance/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 9 | `/dashboard/alerts` | `app/dashboard/alerts/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 10 | `/dashboard/reports` | `app/dashboard/reports/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 11 | `/dashboard/forensics` | `app/dashboard/forensics/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 12 | `/dashboard/incidents` | `app/dashboard/incidents/page.tsx` | **Server** | BROKEN (wrong table) |
| 13 | `/dashboard/investigations` | `app/dashboard/investigations/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 14 | `/dashboard/replay` | `app/dashboard/replay/page.tsx` | Client | FUNCTIONAL |
| 15 | `/dashboard/simulation` | `app/dashboard/simulation/page.tsx` | Client | FUNCTIONAL |
| 16 | `/dashboard/testing` | `app/dashboard/testing/page.tsx` | Client | FUNCTIONAL |
| 17 | `/dashboard/playground` | `app/dashboard/playground/page.tsx` | Client | FUNCTIONAL |
| 18 | `/dashboard/agents` | `app/dashboard/agents/page.tsx` | Client | PARTIALLY FUNCTIONAL |
| 19 | `/dashboard/billing` | `app/dashboard/billing/page.tsx` | Client | DEMO DATA ONLY |
| 20 | `/dashboard/usage` | `app/dashboard/usage/page.tsx` | Client | DEMO DATA ONLY |
| 21 | `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Client | UNKNOWN |
| 22 | `/dashboard/settings/access` | `app/dashboard/settings/access/page.tsx` | Client | UNKNOWN |
| 23 | `/dashboard/settings/integrations` | `app/dashboard/settings/integrations/page.tsx` | Client | UNKNOWN |

---

## 5. FULL PAGE DISSECTION

---

### PAGE 1 — `/dashboard` (Executive Risk Overview)

**Purpose:** Master dashboard showing aggregated risk metrics, drift trends, active alerts, governance state, and recent investigations.

**Data Source:** `useDashboardData("/api/dashboard/stats")` — falls back to 200 lines of hardcoded `FALLBACK` demo data on any error.

**UI Layout (top to bottom):**
1. Status Bar — "Governance Mode: ACTIVE | Risk Level: LOW | System Integrity: VERIFIED" (hardcoded strings)
2. Header — "Executive Risk Overview" + optional "⚠ Fallback Data" badge
3. `DashboardFilters` — date range, model version, channel selectors
4. `ExecutiveHealthCard` — receives `data?.health`
5. `DriftTrendCard` — receives `data?.drift`
6. `ActiveAlertsCard` + `RiskBreakdownCard` — 2-column grid
7. `GovernanceStateCard` — fetches `/api/governance/state?orgId=demo-org-123` (hardcoded)
8. `GovernanceSnapshotCard` — unknown endpoint
9. `IntelligenceDashboard` — receives `data?.intelligence`
10. `RecentInvestigationsCard` — receives `data?.investigations`
11. `QuickStart` — onboarding component

**Components Used:**
- `ExecutiveHealthCard`, `DriftTrendCard`, `ActiveAlertsCard`, `RiskBreakdownCard`
- `RecentInvestigationsCard`, `GovernanceSnapshotCard`, `GovernanceStateCard`
- `IntelligenceDashboard`, `DashboardFilters`, `QuickStart`
- `Skeleton`, `CardSkeleton`, `ChartSkeleton`, `TableSkeleton`

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Filter controls | Updates local filter state | None | Re-renders with filtered data |
| GovernanceStateCard (internal) | Fetch on mount | `GET /api/governance/state?orgId=demo-org-123` | Shows governance state |

**BROKEN:** `withAuth` on `/api/dashboard/stats` requires real auth session; no real auth = 401 → FALLBACK data always shown.

---

### PAGE 2 — `/dashboard/home` (Executive Overview)

**Purpose:** High-level pillar view of the four product pillars (Gateway, Intelligence, Governance, Agents) with a multi-layer activity chart.

**Data Source:** `GET /api/product/overview` — returns `health_score`, `risk_level`, `gateway`, `intelligence`, `governance`, `agents` objects.

**UI Layout:**
1. Header — "Facttic v1 Dashboard" + Engine/Executive mode toggle
2. LEFT column: AI Health Index card (score, risk level, progress bars per metric)
3. LEFT column: Enterprise Protection card (blocked responses, drift alerts)
4. RIGHT: 4 PillarCards (Gateway, Intelligence, Governance, Agents)
5. RIGHT: Area Chart — "Multi-Layer Activity Timeline" — **HARDCODED data** (not from API)

**Actions:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Engine View / Executive View toggle | Toggles `executiveMode` state | None | UI label change only |

**BROKEN:** Area chart data is hardcoded, not dynamic.

---

### PAGE 3 — `/dashboard/trust` (Trust Center)

**Purpose:** Institutional trust and compliance statement page. Marketing-style static page showing governance architecture, data handling policies, security model, audit ledger description, compliance readiness.

**Data Source:** NONE — fully static.

**UI Layout:**
1. Status banner (hardcoded "ACTIVE / VERIFIED / COMPLIANT")
2. Platform Governance Model section (architecture flow diagram)
3. Data Handling section
4. Security Model section
5. Audit Ledger Intelligence section
6. Compliance Readiness (SOC2, HIPAA, GDPR badges)
7. Footer guarantee

**Actions:** None — pure informational page.

---

### PAGE 4 — `/dashboard/connect` (Connect AI / Infrastructure)

**Purpose:** Manage AI provider connections. List active connections with health status and latency. Add new connections via ConnectionWizard.

**Data Source:** Direct Supabase anon client query to `ai_connections` table.

**UI Layout:**
1. Header — "Infrastructure" + "Connect Provider" button
2. Loading state or empty state
3. Active connections grid — cards per provider
4. Each card: provider icon, name, mode badge, model, health dot + latency, creation date, delete button (hover)
5. ConnectionWizard (modal on "Connect Provider" click)

**Components:**
- `ConnectionWizard` (`components/setup/ConnectionWizard.tsx`)

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Connect Provider | Shows `ConnectionWizard` | Wizard calls `/api/integrations/connect` | Creates new connection |
| Refresh (icon) | Re-fetches connections | Supabase anon `ai_connections` | Updates list |
| Delete (hover on card) | Confirm dialog → delete | Supabase anon `ai_connections.delete()` | Removes provider |

**ISSUE:** Direct Supabase anon client used — bypasses API layer. RLS must be correctly configured.

---

### PAGE 5 — `/dashboard/governance` (Governance Control Center)

**Purpose:** Real-time governance dashboard showing state, risk score, drift, economic anomalies, active alerts feed, simulation data, and playground activity. 10-second polling interval.

**Data Source:** 7 parallel API calls every 10 seconds, all with `DEMO_ORG_ID = "00000000-0000-0000-0000-000000000000"` hardcoded.

**API Calls Made:**
1. `GET /api/governance/state?orgId=DEMO_ORG_ID` → governance_state, status
2. `GET /api/governance/metrics?org_id=DEMO_ORG_ID` → session_risk, simulation, governance_health
3. `GET /api/governance/alerts?org_id=DEMO_ORG_ID` → alerts array
4. `GET /api/intelligence/predictive-drift?orgId=DEMO_ORG_ID&model=default` → drift_score, escalation
5. `GET /api/economics/cost-anomalies` → anomalies array
6. `GET /api/dashboard/governance/playground?org_id=DEMO_ORG_ID` → playground activity
7. `GET /api/dashboard/governance/risk-trend?org_id=DEMO_ORG_ID` → trend array

**UI Layout:**
1. Header — "Facttic Control Center" + sync status + last pulse timestamp
2. 4-card metrics row: Governance State | Predictive Drift | Economic Integrity | Session Risk
3. `SimulationWidget` + `GovernanceHealthTimeline` (2-col)
4. Active Alerts Feed (last 6 alerts)
5. Playground Usage + Weighted Signals sidebar

**Components:**
- `SimulationWidget`, `RiskTrendChart`, `GovernanceHealthTimeline`

**Actions:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Auto-refresh (10s interval) | Re-fetches all 7 endpoints | 7 endpoints above | Live data update |

**BROKEN:** `DEMO_ORG_ID` hardcoded — shows demo org data for all users. Alerts are fetched from `facttic_incidents` table (wrong table, see governance/alerts route analysis).

---

### PAGE 6 — `/dashboard/intelligence` (Guardrails / AI Intelligence)

**Purpose:** Multi-tab intelligence dashboard showing cross-session patterns, silent regression detection, behavior forensics, hallucination risk, model consistency, and predictive drift. Largest page in the codebase (29k tokens).

**Data Source:** Multiple internal hooks calling separate APIs:
- `POST /api/intelligence/cross-session` → `{ org_id, timeframe }`
- `POST /api/intelligence/regression` → `{ org_id, model_version, timeframe }`
- `POST /api/forensics/behavior/[sessionId]` → behavior signals
- `GET /api/intelligence/hallucination-risk` → risk data
- `GET /api/intelligence/model-consistency` → consistency data
- `GET /api/intelligence/predictive-drift` → drift data

**UI Layout:**
1. Multiple tabbed sections for each intelligence module
2. Area charts, radar charts, scatter plots
3. Feature-flag gated sections (`isFeatureEnabled`)

**ISSUE:** Uses `ComingSoonBlock` for some sections — indicates features are incomplete.

---

### PAGE 7 — `/dashboard/observability` (Live Monitor)

**Purpose:** Real-time telemetry feed showing governance events as they happen. Also shows provider infrastructure health and alert distribution.

**Data Sources:**
- `GET /api/observability/advanced-metrics` → telemetry stats (falls back to `demoSignals.observability`)
- Direct anon Supabase query: `supabase.from('ai_connections').select('id, provider_type')` → provider list
- `getProviderStatus(conn.id)` → health check per provider
- Supabase Realtime: `supabase.channel('telemetry').on('broadcast', { event: 'governance_event' }, cb)`

**UI Layout:**
1. Header — "Advanced Observability" (or "Audio Stream Intelligence" for voice mode)
2. 4 stat cards: Risk Latency P95 | Drift Propagation | Daily Alert Volume | Spike Incidents
3. Live Telemetry Feed (shows "Awaiting Events..." when empty)
4. Alert Signature distribution (pie-style bars)
5. Provider Infrastructure Integrity grid

**Actions:**

| Element | Action | Data Source | Result |
|---|---|---|---|
| Live Feed | Passive — receives from Supabase Realtime | `channel('telemetry')` | Shows governance events |
| Provider cards | Passive — render from health check | `getProviderStatus()` | Shows health/latency |

**BROKEN:** Live feed always shows "Awaiting Events..." because:
1. `EvidenceLedger.write()` fails (schema mismatch) → broadcast inside try never fires
2. `/api/governance/execute` broadcast never fires (db.insert throws on NOT NULL violations)
3. Only `/api/chat` fires broadcast but `void fetch()` suppresses errors
4. Realtime is ephemeral — events dropped if no subscriber connected at time of emission

---

### PAGE 8 — `/dashboard/compliance` (Drift Intelligence / PII Surveillance)

**Purpose:** Monitor PII data leakage across model endpoints. View compliance risk scores, sensitive entity frequency, and the governance event ledger feed.

**Data Sources:**
- `GET /api/compliance/signals?org_id=ORG_ID&limit=50` → compliance signals (pii_detected, entities, risk score)
- `GET /api/compliance/ledger?org_id=ORG_ID&limit=50` → governance ledger events

**Hardcoded:** `ORG_ID = "864c43c5-0484-4955-a353-f0435582a4af"`

**UI Layout:**
1. Header — "PII Surveillance" + Sync Telemetry + Export Evidence buttons
2. 4 stat cards: Exposed Sessions | Compliance Health | Signal Velocity | Ledger Depth
3. PII Risk Heatmap (line chart over time)
4. Sensitive Entity Frequency (bar chart)
5. Governance Ledger Feed (event list)
6. Automated PII Safeguards card + Signal Stream (right sidebar)

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Sync Telemetry | Re-fetches all data | `/api/compliance/signals` + `/api/compliance/ledger` | Refreshes UI |
| Export Evidence | Downloads JSON | `POST /api/compliance/export` | Downloads audit file |
| Launch Enforcement | No handler — `button` with no `onClick` | None | **DEAD BUTTON** |

---

### PAGE 9 — `/dashboard/alerts` (Escalation Logs)

**Purpose:** Show escalation alerts from the governance pipeline, allow severity filtering, verify ledger integrity, and manage incident response.

**Data Sources:**
- `GET /api/governance/alerts` → alerts array
- `GET /api/ledger/verify` → ledger integrity check

**UI Layout:**
1. `IncidentResponsePanel` — maps alerts data to incident shape (workaround)
2. Governance Event Ledger Integrity widget + "Verify Signature Chain" button
3. "Escalation Logs" header with severity filter (All / Critical / High / Low)
4. Alerts table: Institutional State | Escalation Reason | Channel Binding | Telemetry Hash | Verify button

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Verify Signature Chain | Checks ledger integrity | `GET /api/ledger/verify` | Shows integrity result |
| Severity filters | Filters local state | None | Filters displayed alerts |
| Verify (per alert) | Navigates to `/dashboard/executive` | None | **BROKEN — page doesn't exist** |
| Resolve (in IncidentResponsePanel) | Optimistic UI update only | None | **No API call — frontend only** |

---

### PAGE 10 — `/dashboard/reports` (Governance Reports)

**Purpose:** Generate and download governance reports, benchmark AI model performance, view cost intelligence, and export the audit chain.

**Data Sources:**
- `GET /api/benchmarks` → benchmark report per model
- `GET /api/governance/maturity` → maturity score and metrics
- `GET /api/cost/metrics` → cost summary per model
- `GET /api/governance/ledger` → raw ledger for download
- `POST /api/evidence/generate` → certified evidence package
- `POST /api/governance/reports/generate` → via `ReportBuilder` component

**Hardcoded:** `org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc'` in Evidence Package builder button

**UI Layout:**
1. Header — "Governance Reports"
2. `ReportBuilder` component
3. `GovernanceMaturityPanel` — circular score + 4 metrics
4. `BenchmarkPanel` — top model, governance index, per-model bars
5. `CostIntelligencePanel` — total cost, token bar chart, risk-to-cost ratio
6. Governance Event Ledger section — Audit Chain Export + Evidence Package Builder

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Recompute (Benchmark) | Refreshes with `?refresh=true` | `GET /api/benchmarks?refresh=true` | Re-runs benchmark |
| Seed Demo (Cost) | Seeds cost data | `GET /api/cost/metrics?seed=true` | Populates demo data |
| Download Raw Ledger | Fetches + downloads JSON | `GET /api/governance/ledger` | Downloads audit chain |
| Generate Certified Package | Builds + downloads | `POST /api/evidence/generate` | Downloads evidence package |

---

### PAGE 11 — `/dashboard/forensics` (Forensics Dashboard)

**Purpose:** Deep forensic investigation of specific sessions. Shows RCA graph, behavior anomaly signals, event timeline, and turn-by-turn replay.

**Data Sources:**
- `GET /api/governance/sessions?limit=10&high_risk=true` → session list
- `GET /api/forensics/rca-graph/[sessionId]` → root cause analysis
- `GET /api/forensics/behavior/[sessionId]` → behavior signals
- `GET /api/governance/timeline/[sessionId]` → event timeline
- `GET /api/governance/sessions/[sessionId]/turns` → individual turns

**UI Layout:**
1. Sticky header — "Forensics Dashboard" + session selector dropdown + Inspect Replay link + Refresh
2. Left column (col-span-3): `ForensicsTimeline` (evidence timeline)
3. Center column (col-span-5): `RcaGraph` + `BehaviorAnomalySignals`
4. Right column (col-span-4): `TurnTimeline` (turn-by-turn replay)

**Components:**
- `ForensicsTimeline`, `RcaGraph`, `BehaviorAnomalySignals`, `TurnTimeline`

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Session selector | Changes selected session | Re-fetches all 4 forensics APIs | Updates all panels |
| Inspect Replay | Navigates to `/dashboard/replay?session=[id]` | None | Opens session replay |
| Export Audit Log | Click handler | None | **DEAD — no onClick** |
| Refresh button | No handler | None | **DEAD — no onClick** |

---

### PAGE 12 — `/dashboard/incidents` (Incident Timeline)

**Purpose:** Chronological reconstruction of governance incidents from the database.

**Data Source:** **SERVER COMPONENT** — directly queries Supabase with service role key.

```
resolveOrgContext('user-1234')  ← HARDCODED fake user ID
supabaseServer.from('incidents').select('*').order('timestamp').limit(200)
```

**UI Layout:**
1. Header — "Incident Timeline"
2. `IncidentControls` component — renders the incident list

**BROKEN:**
- `resolveOrgContext('user-1234')` always fails (fake user) → falls back to first `org_members` row
- Queries `incidents` table — this table has no migration file; may not exist
- Risk scores are synthetic mappings from severity strings, not real values

---

### PAGE 13 — `/dashboard/investigations` (Investigations)

**Purpose:** List and investigate governance incidents. Open an investigation to view its session timeline.

**Data Source:**
- `GET /api/governance/investigations` → investigations list
- `GET /api/sessions/[session_id]/timeline` → session timeline for selected investigation

**UI Layout:**
1. Investigation list (table)
2. Selected investigation panel with embedded timeline

**Actions:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Open investigation | Fetches timeline | `GET /api/sessions/[id]/timeline` | Shows timeline panel |

**ISSUE:** Falls back to hardcoded mock timeline data if API returns empty.

---

### PAGE 14 — `/dashboard/replay` (Session Replay)

**Purpose:** Browse recent governance sessions and replay individual sessions turn-by-turn.

**Data Source:**
- `GET /api/governance/sessions` → `{ sessions: [...] }` — reads from `sessions` table
- On session click: `ReplayViewer` loads → calls `/api/governance/timeline/[id]` or similar

**UI Layout:**
1. Session list table — Session ID | Status | Risk Score | Time
2. Click → `ReplayViewer` renders for selected session

**Components:**
- `ReplayViewer` (`components/replay/ReplayViewer.tsx`)

**Actions:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Session row click | Navigate to `?session=[id]` | None | Shows ReplayViewer |

**FIXED (current session):** Now correctly uses `data.sessions || []` and renders `session.total_risk` / `session.status`.

---

### PAGE 15 — `/dashboard/simulation` (Traffic Simulation Lab)

**Purpose:** Generate synthetic governance events to test system resilience. Select scenario, set volume, run simulation.

**Data Source:**
- `POST /api/simulation/run` → `{ scenario, volume, org_id }`

**Hardcoded:** `org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc'`

**UI Layout:**
1. Header — "Traffic Simulation Lab"
2. `ScenarioSelector` (left) — scenario picker + volume slider + Run button
3. Simulation Logs console (right) — live log entries with decision/risk

**Components:**
- `ScenarioSelector` (`components/simulation/ScenarioSelector.tsx`)

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Run Simulation | Sends batch | `POST /api/simulation/run` | Returns log array |

---

### PAGE 16 — `/dashboard/testing` (Stress Testing)

**Purpose:** Subject the system to concurrent load to identify breaking points, latency shifts, and failover behavior.

**Data Source:**
- `POST /api/testing/stress` → `{ org_id, concurrency, duration_seconds }`

**Hardcoded:** `org_id: '00000000-0000-0000-0000-000000000000'`

**UI Layout:**
1. Header — "Stress Testing"
2. Controls (left): Concurrency slider | Duration slider | "Initiate Stress" button
3. Stability Timeline (right): bar chart of past runs, latency visualization
4. Warning alert if failure_rate > 5%

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Initiate Stress | Sends stress test | `POST /api/testing/stress` | Returns `{ result: { total_requests, failure_rate, latency_ms } }` |

---

### PAGE 17 — `/dashboard/playground` (Governance Playground)

**Purpose:** Interactive sandbox for testing prompts directly through the governance pipeline in real-time.

**Data Source:**
- `POST /api/chat` — with `Authorization: Bearer facttic-test-key` and hardcoded `org_id: '864c43c5-0484-4955-a353-f0435582a4af'`

**UI Layout:**
1. Header — "Governance Playground"
2. `PromptRunner` (left) — prompt input, model selector, run button
3. `GovernanceResults` (right) — decision, risk score, violations, signals

**Components:**
- `PromptRunner`, `GovernanceResults`

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Run Governance | Submits prompt | `POST /api/chat` | Returns `{ decision, risk_score, violations, behavior }` |

---

### PAGE 18 — `/dashboard/agents` (AI Agent Control)

**Purpose:** Monitor managed AI agent sessions, show risk heatmap by threat category, display tool usage statistics.

**Data Source:**
- `GET /api/agents/sessions` → agent session list
- `POST /api/agents/step` with `{ seed: true }` → seeds demo agent data

**UI Layout:**
1. Header — "AI Agent Control" (or "Voice Agent Orchestration" for voice mode)
2. 4 stat cards (HARDCODED values): Active Agents: 12 | Steps: 1420 | Blocked Tools: 8 | Avg Risk: 12.4
3. Managed Agent Sessions list — name, session id, steps, risk, status, play/block buttons
4. Agent Risk Heatmap (RadarChart — HARDCODED data)
5. Top Tool Triggers (HARDCODED: sql_executor, web_search, aws_lambda, internal_api)

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Spawn Demo Agent | Seeds agent data | `POST /api/agents/step` + `GET /api/agents/sessions` | Populates agent list |
| Play button (per agent) | No handler | None | **DEAD BUTTON** |
| Block button (per agent) | No handler | None | **DEAD BUTTON** |

---

### PAGE 19 — `/dashboard/billing` (Plan & Billing)

**Purpose:** Show current subscription plan, usage threshold, invoice history, and pricing tiers.

**Data Source:**
- `GET /api/dashboard/billing/plan?org_id=DEMO_ORG_ID` → plan data

**Hardcoded:**
- `DEMO_ORG_ID = "00000000-0000-0000-0000-000000000000"`
- Invoice data is hardcoded: `FC-9921, FC-8812, FC-7703`

**UI Layout:**
1. Header — "Plan & Billing"
2. Active Subscription card — plan name, usage bar, next billing date
3. Invoice Ledger — hardcoded invoices with Download button
4. Billing cycle toggle (Monthly/Annual)
5. 3 pricing tiers: Starter | Growth (featured) | Scale
6. Enterprise Financial Integrity footer

**Button / Action Map:**

| Button | Action | API Called | Result |
|---|---|---|---|
| Select Starter/Scale | No API call | None | **DEAD BUTTON** |
| Upgrade to Growth | No API call | None | **DEAD BUTTON** |
| Invoice Download | No handler | None | **DEAD BUTTON** |
| View Full History | No handler | None | **DEAD BUTTON** |
| Manage Payment Methods | No handler | None | **DEAD BUTTON** |

---

### PAGE 20 — `/dashboard/usage` (Governance Usage)

**Purpose:** Show token consumption, interactions used, risk evaluations, and policy alerts for the organization.

**Data Source:**
- `GET /api/dashboard/billing/usage?org_id=DEMO_ORG_ID`

**Hardcoded:** `DEMO_ORG_ID = "00000000-0000-0000-0000-000000000000"`

**UI Layout:**
1. Header — "Governance Usage"
2. 4 metric cards: Interactions Used | Token Consumption | Risk Evaluations | Policy Alerts
3. Consumption Velocity bar chart — **HARDCODED data** (12 bars with fixed heights)

**BROKEN:** Chart data is purely decorative. Usage metrics are from the API.

---

## 6. API ROUTE INVENTORY

### Primary Governance Routes

| Endpoint | Method | Purpose | Auth | Tables Used | Status |
|---|---|---|---|---|---|
| `/api/chat` | POST | Primary governance entry point | `verifyApiKey` | `sessions`, `session_turns`, `incidents`, `facttic_governance_events` | FUNCTIONAL |
| `/api/governance/execute` | POST | Secondary governance entry point (headless) | `verifyApiKey` | `governance_event_ledger` (BROKEN), `sessions` | BROKEN (db.insert fails) |
| `/api/governance/sessions` | GET | List sessions for org | `resolveOrgContext` (hardcoded) | `sessions`, `org_members` | FUNCTIONAL |
| `/api/governance/sessions/[id]/turns` | GET | Get turns for a session | None | `session_turns` | UNKNOWN |
| `/api/governance/alerts` | GET | Get active alerts | `verifyApiKey` | `facttic_incidents` | BROKEN (wrong table) |
| `/api/governance/state` | GET | Get governance state | None | Unknown | UNKNOWN |
| `/api/governance/metrics` | GET | Get governance metrics | None | Unknown | UNKNOWN |
| `/api/governance/timeline/[sessionId]` | GET | Get event timeline | None | `facttic_governance_events` | FUNCTIONAL |
| `/api/governance/policies` | GET | List policies | None | `governance_policies` | UNKNOWN |
| `/api/governance/policies/create` | POST | Create policy | None | `governance_policies` | UNKNOWN |
| `/api/governance/policies/update` | POST | Update policy | None | `governance_policies` | UNKNOWN |
| `/api/governance/policies/archive` | POST | Archive policy | None | `governance_policies` | UNKNOWN |
| `/api/governance/ledger` | GET | Fetch ledger chain | None | `governance_event_ledger` | PARTIALLY FUNCTIONAL |
| `/api/governance/ledger/verify` | GET | Verify ledger integrity | None | `governance_event_ledger` | UNKNOWN |
| `/api/governance/ledger/integrity` | GET | Ledger integrity check | None | `facttic_governance_events` | FUNCTIONAL |
| `/api/governance/investigations` | GET | List investigations | None | `drift_alerts`, `governance_root_cause_reports` | UNKNOWN |
| `/api/governance/maturity` | GET | Governance maturity score | None | `governance_maturity_scores` | FUNCTIONAL |
| `/api/governance/drift` | GET | Drift analysis | None | Unknown | UNKNOWN |
| `/api/governance/evaluate` | POST | Policy evaluation | None | Unknown | UNKNOWN |
| `/api/governance/intercept` | POST | Intercept event | None | `interceptor_events` | UNKNOWN |
| `/api/governance/reports/generate` | POST | Generate report | None | Multiple | UNKNOWN |
| `/api/governance/replay` | GET | Session replay data | None | `facttic_governance_events` | UNKNOWN |

### Dashboard Routes

| Endpoint | Method | Auth | Tables | Status |
|---|---|---|---|---|
| `/api/dashboard/stats` | GET | `withAuth` | `governance_snapshot_v1`, `governance_predictions`, `governance_escalation_log`, `drift_alerts`, `facttic_governance_events`, `facttic_incidents` | BROKEN (facttic_incidents missing) |
| `/api/dashboard/billing/plan` | GET | None | `billing_plans`? | UNKNOWN |
| `/api/dashboard/billing/usage` | GET | None | Unknown | UNKNOWN |
| `/api/dashboard/governance/health-timeline` | GET | None | Unknown | UNKNOWN |
| `/api/dashboard/governance/playground` | GET | None | `facttic_governance_events`? | UNKNOWN |
| `/api/dashboard/governance/risk-trend` | GET | None | Unknown | UNKNOWN |
| `/api/dashboard/governance/simulation` | GET | None | Unknown | UNKNOWN |

### Forensics Routes

| Endpoint | Method | Tables | Status |
|---|---|---|---|
| `/api/forensics/analyze` | POST | `behavior_forensics` | UNKNOWN |
| `/api/forensics/behavior/[sessionId]` | GET | `behavior_forensics` | FUNCTIONAL |
| `/api/forensics/rca-graph/[sessionId]` | GET | `governance_root_cause_reports`? | FUNCTIONAL |
| `/api/forensics/rca/[sessionId]` | GET | Similar | FUNCTIONAL |
| `/api/forensics/incidents` | GET | `facttic_incidents` | BROKEN (table missing) |

### Intelligence Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/intelligence/cross-session` | POST | Cross-session pattern analysis |
| `/api/intelligence/hallucination-risk` | GET | Hallucination risk score |
| `/api/intelligence/model-consistency` | GET | Model consistency tests |
| `/api/intelligence/predictive-drift` | GET | Predictive drift scoring |
| `/api/intelligence/regression` | POST | Silent regression detection |

### Integration Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/integrations/connect` | POST | Create AI provider connection |
| `/api/integrations/status` | GET | Check integration status |
| `/api/integrations/elevenlabs/webhook` | POST | ElevenLabs voice webhook |
| `/api/integrations/retell/webhook` | POST | Retell voice webhook |
| `/api/integrations/vapi/webhook` | POST | VAPI voice webhook |

### Auth Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/callback` | GET | Supabase OAuth callback |
| `/api/auth/signup` | POST | User registration |

### System / Utility Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | System health check |
| `/api/system/report` | GET | Full system state report |
| `/api/simulation/run` | POST | Run simulation scenario |
| `/api/testing/stress` | POST | Run stress test |
| `/api/testing/run` | POST | Run governance test |
| `/api/benchmarks` | GET | AI governance benchmarks |
| `/api/cost/metrics` | GET | Cost per model metrics |
| `/api/product/overview` | GET | High-level product stats |
| `/api/evidence/generate` | POST | Generate evidence package |
| `/api/agents/sessions` | GET | List agent sessions |
| `/api/agents/step` | POST | Advance/seed agent |
| `/api/ledger/verify` | GET | Verify ledger chain |
| `/api/compliance/signals` | GET | PII compliance signals |
| `/api/compliance/ledger` | GET | Compliance ledger events |
| `/api/compliance/export` | POST | Export compliance data |
| `/api/sessions/[id]/timeline` | GET | Session event timeline |
| `/api/sessions/[id]/turn` | GET | Individual turn data |

---

## 7. DATABASE TABLE DISCOVERY

All tables found via `supabase.from()` calls and migration files:

### Core Identity Tables (migration: 20260223000000)

| Table | Key Columns | Purpose |
|---|---|---|
| `organizations` | id, name, slug, created_at | Tenant registry |
| `users` | id (FK auth.users), email, full_name | User accounts |
| `org_members` | id, user_id, org_id, role (owner/admin/analyst/viewer) | RBAC membership |
| `audit_logs` | id, org_id, actor_id, action, metadata JSONB | Append-only audit trail |
| `webhook_events` | id, org_id, provider, event_id, idempotency_key | Webhook deduplication |

### Auth & Security Tables

| Table | Key Columns | Purpose |
|---|---|---|
| `api_keys` | id, org_id, key_hash, status, rate_limit | API key management |
| `org_encryption_keys` | (from migration 20260317) | BYOK encryption |

### AI Provider Tables

| Table | Key Columns | Purpose |
|---|---|---|
| `ai_connections` | id, org_id, provider_type, model, interaction_mode, status, created_at | Connected AI providers (chat+voice) |

### Core Governance Tables

| Table | Key Columns | Purpose | Migration |
|---|---|---|---|
| `facttic_governance_events` | id, session_id, org_id, timestamp BIGINT, event_type, prompt, model, decision, risk_score, violations JSONB, guardrail_signals JSONB, latency | PRIMARY EVENT STORE — written by EvidenceLedger.write() | 20260322000001 |
| `governance_event_ledger` | id, org_id, event_type CHECK, event_payload JSONB, previous_hash, current_hash, signature | TAMPER-PROOF CHAIN LEDGER — written by execute/route.ts | 20260304000003 |
| `governance_policies` | (from migration 20260306000003) | Policy rules and configurations | 20260306000003 |

### Session Tables (NO MIGRATION FILES — CODE-ONLY)

| Table | Columns Referenced in Code | Purpose |
|---|---|---|
| `sessions` | id, org_id, status, total_risk, decision, risk_score, ended_at, created_at | Session state per conversation |
| `session_turns` | session_id, org_id, turn_index, prompt, decision, incremental_risk, created_at | Individual turns within sessions |
| `incidents` | session_id, org_id, severity, violation_type, timestamp | Governance incidents |

**CRITICAL:** `sessions`, `session_turns`, and `incidents` have NO CREATE TABLE migration. They are referenced extensively in code but may not exist in production database.

### Analytics & Intelligence Tables

| Table | Migration | Purpose |
|---|---|---|
| `behavior_forensics` | 20260306000002 | Behavioral analysis per session |
| `governance_maturity_scores` | 20260306000004 | Org maturity snapshots |
| `simulation_runs` | 20260305000006 / 20260306000001 | Simulation run history |
| `governance_predictions` | 20260226000007 | Predictive drift predictions |
| `governance_snapshot_v1` | Various | Dashboard aggregate snapshots |
| `governance_escalation_log` | Various | Alert escalation history |
| `drift_alerts` | Various | Model drift alerts |
| `governance_root_cause_reports` | Various | RCA report storage |
| `predictive_drift_events` | 20260316000001 | Drift event history |
| `model_drift` | 20260310000002 | Model drift records |
| `model_consistency_tests` | 20260319000001 | Consistency test results |
| `ai_health_scores` | 20260315000001 | AI health score history |
| `global_risk_signals` | 20260312000001 | Cross-org risk signals |
| `silent_regression_intelligence` | 20260304000001 | Regression tracking |

### Integration / Infrastructure Tables

| Table | Migration | Purpose |
|---|---|---|
| `external_integrations` | 20260309000002 | External tool connections |
| `governance_benchmarks` | 20260309000002 | Benchmark results |
| `interceptor_events` | 20260309000004 | Interceptor event log |
| `deployment_configs` | 20260309000005 | Deployment configurations |
| `event_streams` | 20260310000001 | Event stream registry |
| `runtime_intercepts` | 20260311000001 | Runtime intercept events |
| `runtime_policies` | 20260311000002 | Runtime policy rules |
| `gateway_requests` | 20260311000003 | AI gateway request log |
| `autonomous_actions` | 20260311000005 | Autonomous governor actions |
| `disaster_recovery_snapshots` | 20260318000001 | DR snapshots |

### Compliance & Finance Tables

| Table | Migration | Purpose |
|---|---|---|
| `review_queue` / `governance_review_queue` | 20260310000004 / 20260320000001 | Human review queue |
| `cost_metrics` | 20260310000005 | Cost per model/session |
| `evidence_packages` | 20260305000004 | Evidence package storage |
| `guardrail_rules` | 20260305000005 | Custom guardrail configurations |
| `agent_sessions` | 20260314000001 | Agent session records |
| `voice_metrics` | 20260310000003 | Voice-specific metrics |
| `routing_metrics` | 20260313000001 | Gateway routing stats |

### Tables Referenced in Code but NO Migration Found

| Table | Where Used | Status |
|---|---|---|
| `sessions` | /api/chat, /api/governance/sessions, /api/governance/execute, bridges | **CRITICAL MISSING** |
| `session_turns` | /api/chat, session replay components | **CRITICAL MISSING** |
| `incidents` | /dashboard/incidents, /api/chat | **CRITICAL MISSING** |
| `facttic_incidents` | /api/governance/alerts, /api/dashboard/stats | **CRITICAL MISSING** |
| `conversation_timeline` | governanceSessionBridge.ts | **MISSING** |
| `compliance_signals` | /api/compliance/signals | **MISSING** |
| `billing_plans` | /api/dashboard/billing/plan | **UNKNOWN** |
| `profiles` | src/api/webhooks/auth.ts | **MISSING** |
| `tenant_configs` | src/api/settings/tenant | **MISSING** |
| `chat_conversations` | src/database/chatConversations.ts | **MISSING** |
| `voice_conversations` | src/database/voiceConversations.ts | **MISSING** |
| `voice_risk_scores` | src/database/voiceRiskScores.ts | **MISSING** |

---

## 8. SYSTEM PIPELINE ANALYSIS

### Primary Chat Pipeline (`/api/chat`)

```
1. Client Request
   POST /api/chat
   Body: { org_id, prompt, model?, session_id? }
   Header: Authorization: Bearer [api_key]
   │
2. API Key Verification
   verifyApiKey(req) → checks api_keys table (key_hash)
   → Returns org_id from key
   │
3. Fraud Detection
   FraudDetectionEngine.evaluate({ session_id, org_id, prompt })
   → Check for anomalous patterns
   → If fraudulent: return 403
   → If throttle: return 429
   │
4. Governance Pipeline
   GovernancePipeline.execute({ org_id, session_id, prompt })
   │
   ├── runAnalyzers() — 12 parallel analyzers:
   │   ├── promptInjectionAnalyzer
   │   ├── jailbreakAnalyzer
   │   ├── dataExfiltrationAnalyzer
   │   ├── hallucinationAnalyzer
   │   ├── sensitiveDataAnalyzer
   │   ├── systemPromptDisclosureAnalyzer
   │   ├── systemPromptExtractionAnalyzer
   │   ├── legalAdviceAnalyzer
   │   ├── medicalAdviceAnalyzer
   │   ├── policyOverrideAnalyzer
   │   ├── roleManipulationAnalyzer
   │   └── toolHijackingAnalyzer
   │
   ├── Risk Scoring (composite formula):
   │   0.35×PI + 0.25×DE + 0.20×JB + 0.10×intent_drift + 0.10×override_detect
   │
   ├── Policy Evaluation (policyEngine)
   │
   ├── Decision: ALLOW | WARN | BLOCK
   │
   ├── GovernanceAlertEngine.evaluate() [side effect — NOT awaited]
   │
   └── Returns: { decision, risk_score, violations, signals, behavior }
   │
5. Evidence Ledger Write (try/catch — non-blocking on fail)
   EvidenceLedger.write({...}) → INSERT to facttic_governance_events
   │
6. Session Persistence (try/catch — non-blocking on fail)
   supabaseServer.from('sessions').upsert({...})
   supabaseServer.from('session_turns').insert({...})
   │
7. Incident Persistence (if decision !== ALLOW or risk > 0)
   supabaseServer.from('incidents').insert({...})
   │
8. Realtime Broadcast (try/catch — non-blocking on fail)
   POST [SUPABASE_URL]/realtime/v1/api/broadcast
   topic: "realtime:telemetry"
   event: "governance_event"
   payload: { session_id, org_id, decision, risk_score, timestamp }
   │
9. Response to Client
   { status: 'ok', session_id, decision, risk_score, behavior, violations, metadata }
```

### Secondary Execute Pipeline (`/api/governance/execute`)

Similar to `/api/chat` but:
- Uses `db.insert("governance_event_ledger", ...)` first — ALWAYS THROWS (NOT NULL violations on missing columns)
- The entire persistence block (EvidenceLedger + broadcast) is skipped when insert throws
- More vulnerable to silent failures

### Realtime Pipeline (Observability → Live Monitor)

```
Emitter (api/chat or api/governance/execute)
  POST [SUPABASE_URL]/realtime/v1/api/broadcast
  topic: "realtime:telemetry"
  event: "governance_event"
       │
       ▼
Supabase Realtime Server
  (ephemeral — dropped if no subscribers connected)
       │
       ▼
Browser Subscriber (app/dashboard/observability/page.tsx)
  supabase.channel('telemetry')
    .on('broadcast', { event: 'governance_event' }, callback)
    .subscribe()
       │
       ▼
setLiveEvents([...payload, ...prev].slice(0, 20))
       │
       ▼
Rendered in Live Telemetry Feed
```

---

## 9. DATA FLOW MAP

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT                               │
│  Playground  │  Chat Interface  │  External API Client              │
└───────┬──────┴────────┬─────────┴───────────┬───────────────────────┘
        │               │                     │
        ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                                     │
│  POST /api/chat    POST /api/governance/execute    Voice Webhooks   │
│  (verifyApiKey)    (verifyApiKey)                  (ElevenLabs/Retell/Vapi)│
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRAUD DETECTION                                  │
│  FraudDetectionEngine.evaluate() → block / throttle / allow        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE PIPELINE                              │
│  GovernancePipeline.execute({ org_id, session_id, prompt })        │
│                                                                     │
│  12 Analyzers (parallel) → Risk Score → Policy Decision            │
│  ALLOW / WARN / BLOCK                                               │
└───────┬──────────────────────┬──────────────────────────────────────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌────────────────────────────────────────────────┐
│  EVIDENCE LEDGER │  │  SESSION PERSISTENCE                           │
│                  │  │                                                │
│  INSERT to       │  │  sessions.upsert(id, org_id, status,          │
│  facttic_        │  │    total_risk, ended_at)                       │
│  governance_     │  │  session_turns.insert(session_id,             │
│  events          │  │    turn_index, prompt, decision)               │
│  (hash chain)    │  │  incidents.insert(if violation)               │
└──────────────────┘  └────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REALTIME BROADCAST                               │
│  POST /realtime/v1/api/broadcast → topic: "realtime:telemetry"    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD LAYER                                  │
│                                                                     │
│  /dashboard/observability  ← Supabase Realtime WebSocket           │
│  /dashboard/replay         ← GET /api/governance/sessions          │
│  /dashboard/forensics      ← GET /api/governance/sessions          │
│                              GET /api/forensics/rca-graph/[id]     │
│                              GET /api/forensics/behavior/[id]      │
│  /dashboard/incidents      ← Direct DB (Server Component)          │
│  /dashboard/alerts         ← GET /api/governance/alerts            │
│  /dashboard/governance     ← 7 parallel API calls                  │
│  /dashboard               ← GET /api/dashboard/stats               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. BROKEN FEATURE DETECTION

### BROKEN PAGES

| Page | Issue | Root Cause |
|---|---|---|
| `/dashboard` | Always shows fallback data | `withAuth` on `/api/dashboard/stats` → no real auth session → 401 → FALLBACK |
| `/dashboard/observability` | Live feed always "Awaiting Events..." | Realtime pipeline broken (see §8) |
| `/dashboard/incidents` | May show empty or error | Queries `incidents` table with no migration |
| `/dashboard/governance` | Shows DEMO data for all users | `DEMO_ORG_ID = "00000000-..."` hardcoded |
| `/dashboard/billing` | Invoices are fake | Invoice data hardcoded in component |
| `/dashboard/usage` | Chart is decorative | 12 hardcoded bar heights |
| `/dashboard/agents` | Stats are hardcoded | `AGENT_STATS` constant, not from API |
| `/dashboard/connect` | Direct anon DB access | Bypasses API layer |
| `/dashboard/home` | Activity chart is fake | 6 hardcoded data points |

### BROKEN API ROUTES

| Route | Issue | Root Cause |
|---|---|---|
| `GET /api/governance/alerts` | Returns 500 or empty | Queries `facttic_incidents` — table has no migration |
| `GET /api/dashboard/stats` | Returns 401 for unauthenticated users | `withAuth` requires real Supabase session |
| `POST /api/governance/execute` | Evidence ledger write fails | `db.insert("governance_event_ledger", {...})` throws — 4 NOT NULL columns missing from insert |
| `GET /api/forensics/incidents` | Returns 500 | Queries `facttic_incidents` — table missing |

### BROKEN BUTTONS

| Page | Button | Issue |
|---|---|---|
| `/dashboard/compliance` | Launch Enforcement | No onClick handler attached |
| `/dashboard/alerts` | Verify (per alert) | Navigates to `/dashboard/executive` which doesn't exist |
| `/dashboard/alerts` | Resolve (incident panel) | Optimistic UI only — no API call, data resets on refresh |
| `/dashboard/forensics` | Export Audit Log | No onClick handler |
| `/dashboard/forensics` | Refresh button | No onClick handler |
| `/dashboard/billing` | Select Starter / Select Scale | No handlers |
| `/dashboard/billing` | Upgrade to Growth | No payment integration |
| `/dashboard/billing` | Invoice Download | No handler |
| `/dashboard/billing` | View Full History | No handler |
| `/dashboard/billing` | Manage Payment Methods | No handler |
| `/dashboard/agents` | Play (per agent) | No onClick handler |
| `/dashboard/agents` | Block (per agent) | No onClick handler |

### BROKEN DATA CONNECTIONS

| Component | Claim | Reality |
|---|---|---|
| `GovernanceStateCard` | Fetches live governance state | Hardcoded `orgId="demo-org-123"` |
| Health counter in Topbar | Shows live system health | Hardcoded `value={84}` |
| `useDashboardData` | Shows real data | Falls back to 200 lines of hardcoded FALLBACK silently |
| Status banner on `/dashboard` | "Governance Mode: ACTIVE" | Hardcoded strings, not live data |
| Status banner on `/dashboard/trust` | "Integrity Ledger: VERIFIED" | Hardcoded strings |
| Activity chart on `/dashboard/home` | "Multi-Layer Activity Timeline" | 6 hardcoded data points |
| Agent stats on `/dashboard/agents` | "Active Agents: 12, Steps: 1420" | Hardcoded `AGENT_STATS` constant |
| Tool triggers on `/dashboard/agents` | Real tool usage | Hardcoded: sql_executor, web_search, aws_lambda |

### MISSING TABLES (No Migration)

| Table | Used By | Impact |
|---|---|---|
| `sessions` | /api/chat, /api/governance/sessions, /api/governance/execute, Session Replay, Forensics | ALL SESSION DATA MISSING |
| `session_turns` | /api/chat, Session Replay | ALL TURN DATA MISSING |
| `incidents` | /dashboard/incidents, /api/chat | INCIDENT PAGE BROKEN |
| `facttic_incidents` | /api/governance/alerts, /api/dashboard/stats | ALERTS + STATS BROKEN |
| `conversation_timeline` | governanceSessionBridge.ts | BRIDGE FAILS SILENTLY |
| `compliance_signals` | /api/compliance/signals | COMPLIANCE PAGE EMPTY |

---

## 11. FINAL SYSTEM ARCHITECTURE REPORT

### Platform Architecture Summary

```
┌──────────────────────────────────────────────────────────┐
│                  FACTTIC v1 ARCHITECTURE                 │
├──────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                      │
│  ┌────────────┐  ┌──────────────────┐                   │
│  │ Dashboard  │  │ Marketing Site   │                   │
│  │ (Next.js)  │  │ (app/marketing)  │                   │
│  └─────┬──────┘  └──────────────────┘                   │
│        │                                                 │
│  CONTROL LAYER                                           │
│  ┌─────▼──────────────────────────────────────────────┐ │
│  │ API Routes (150+ endpoints in app/api/)            │ │
│  │ Auth: verifyApiKey | withAuth | resolveOrgContext  │ │
│  └─────┬──────────────────────────────────────────────┘ │
│        │                                                 │
│  ENGINE LAYER                                            │
│  ┌─────▼──────────────────────────────────────────────┐ │
│  │ GovernancePipeline (lib/governancePipeline.ts)     │ │
│  │  ├── 12 Analyzers (lib/governance/analyzers/)      │ │
│  │  ├── Risk Scoring Engine                           │ │
│  │  ├── Policy Engine                                 │ │
│  │  └── Alert Engine                                  │ │
│  │                                                    │ │
│  │ Supporting Engines:                                │ │
│  │  ├── FraudDetectionEngine                          │ │
│  │  ├── EvidenceLedger                                │ │
│  │  ├── BehaviorForensicsEngine                       │ │
│  │  ├── DriftDetectionEngine                          │ │
│  │  ├── SessionReconstructionEngine                   │ │
│  │  ├── RcaEngine / RcaGraphEngine                    │ │
│  │  ├── ComplianceIntelligenceEngine                  │ │
│  │  └── GovernanceSimulator                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  PERSISTENCE LAYER                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Supabase (Postgres + Auth + Realtime)               ││
│  │  Primary: facttic_governance_events                 ││
│  │  Chain:   governance_event_ledger                   ││
│  │  Session: sessions*, session_turns* (*NO MIGRATION) ││
│  │  Org:     organizations, users, org_members         ││
│  │  Security:api_keys                                  ││
│  └─────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Critical Issues Summary

| Priority | Issue | Impact |
|---|---|---|
| P0 | `sessions`, `session_turns`, `incidents`, `facttic_incidents` tables have no migrations | Session Replay, Incident page, Alerts all broken |
| P0 | `/api/governance/execute` always fails on `db.insert("governance_event_ledger")` due to NOT NULL violations | Headless execute API non-functional |
| P0 | `withAuth` only applied to 1 route (`/api/dashboard/stats`) | All other routes unprotected |
| P1 | 5+ pages use hardcoded org IDs (DEMO_ORG_ID, demo-org-123, etc.) | Multi-tenant isolation broken |
| P1 | Realtime broadcast unreachable from execute route | Live Monitor always empty |
| P1 | `/dashboard/incidents` queries non-existent `incidents` table with hardcoded fake user | Page always fails |
| P1 | `/api/governance/alerts` queries `facttic_incidents` (no migration) | Alerts always empty |
| P2 | 10+ buttons have no onClick handlers | Dead UI |
| P2 | `/dashboard/agents` stats are hardcoded constants | Misleading data |
| P2 | Health counter in topbar hardcoded at 84 | Misleading |
| P2 | `useDashboardData` FALLBACK silently masks all backend failures | Hard to debug |
| P3 | `resolveOrgContext('user-1234')` hardcoded in 2 API routes | Security risk in production |
| P3 | Activity chart on `/dashboard/home` uses 6 hardcoded points | Misleading |

### What IS Working

| Feature | Status |
|---|---|
| `/api/chat` full pipeline | WORKING (sessions table permitting) |
| GovernancePipeline + 12 analyzers | WORKING |
| `facttic_governance_events` writes | WORKING (schema correct) |
| API key authentication | WORKING |
| Fraud detection | WORKING |
| Session replay page (data reading) | WORKING |
| Forensics page (4 data sources) | WORKING |
| Simulation Lab | WORKING |
| Stress Testing | WORKING |
| Governance Playground | WORKING |
| Connect AI page | WORKING |
| Trust Center | STATIC — WORKING |
| Compliance page (signals + ledger) | WORKING |
| Benchmark engine | WORKING |
| Cost metrics engine | WORKING |

---

*End of Architecture Audit — Facttic Platform v1 — 2026-03-07*
*Read-only analysis. No code was modified.*
