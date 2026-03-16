# Facttic AI — UI Component Audit
**Branch:** product-refactor
**Date:** 2026-03-07
**Scope:** `components/` directory — all subdirectories
**Auditor:** Claude Code (automated scan + analysis)

---

## Quick-Reference: Issues Found

| Category | Count | Components |
|---|---|---|
| **Fully hardcoded (no real data)** | 5 | GovernanceSnapshotCard, AdvancedAnalytics, ConsistencyHeatmap, ThreatReplayPanel, GovernanceResults (pipeline logs) |
| **Dead buttons** | 4 | IntelligenceDashboard ×2, AlertPanel ×1 |
| **Dead links** | 2 | VoiceDriftCard (`/dashboard/voice/analysis`), GlobalSearch (`/dashboard/analysis`) |
| **Components calling APIs directly** | 14 | See section §3 |
| **Hardcoded org IDs** | 1 | ConnectionWizard (`'dbad3ca2-...'`) |
| **Security concern** | 1 | VoiceRiskScorePanel (hardcoded `x-api-key` header) |
| **Non-deterministic rendering** | 1 | DriftTrendCard (mini chart uses `Math.random()`) |

---

## §1 — Component Catalogue

### dashboard/

---

#### ExecutiveHealthCard
- **File:** `components/dashboard/ExecutiveHealthCard.tsx`
- **Purpose:** Primary KPI card on the executive dashboard. Shows governance score, sessions, voice calls, drift, RCA confidence, policy adherence, open alerts, tamper integrity.
- **Props:**
  - `data?: HealthData` — optional; uses hardcoded fallback when absent
- **State:** none
- **Hooks:** none (pure render)
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** Inline fallback: `{ governance_score: 84, sessions_today: 428, voice_calls: 87, drift_freq: "2.4%", rca_confidence: "91%", policy_adherence: "96.2% compliant", behavioral_drift: "Monitor", open_alerts: 3, tamper_integrity: "Verified" }`. Calls `computeHealthConfidence(d.sessions_today)` from `lib/metrics/healthConfidence.ts`. Uses `CountUp` for animated numbers.

---

#### GovernanceStateCard
- **File:** `components/dashboard/GovernanceStateCard.tsx`
- **Purpose:** Displays live governance state (SAFE / WATCH / WARNING / CRITICAL / BLOCKED), risk score, and contributing factors.
- **Props:**
  - `orgId: string`
- **State:** `state, loading, error`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/governance/state?orgId=${orgId}`
- **DB tables:** governance_state (via API)
- **Parent pages:** `app/dashboard/page.tsx` (passes hardcoded `"demo-org-123"`)
- **Notes:** ⚠️ Caller passes hardcoded `orgId="demo-org-123"`.

---

#### GovernanceSnapshotCard
- **File:** `components/dashboard/GovernanceSnapshotCard.tsx`
- **Purpose:** Shows a 30-day governance snapshot: phase coverage percentages, system integrity labels, aggregate session/escalation counts.
- **Props:** none
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** 🔴 FULLY HARDCODED. Phase Coverage: 100%/100%/98%/92%/96%/100%. System Integrity: "Sealed"/"Active"/"AES-256"/"Complete"/"Enabled"/"US-East". 30-Day Summary: 12,847 sessions, 23 escalations, 99.99% SLA. All values are literal constants fed into `CountUp`.

---

#### DriftTrendCard
- **File:** `components/dashboard/DriftTrendCard.tsx`
- **Purpose:** Shows behavioral drift trend with a mini bar chart and period selector (7d / 30d / 90d).
- **Props:**
  - `initialData?: DriftData`
  - `filters?: { orgId?, model? }`
- **State:** `data, loading, error, period, animating`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/governance/drift?days=${period}`
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** ⚠️ Mini bar chart uses `Math.random()` for bar heights — visualization is non-deterministic and purely decorative. Hardcoded fallback: `{ current: "2.4%", avg_period: "1.8%", baseline: "0.9%" }`.

---

#### ActiveAlertsCard
- **File:** `components/dashboard/ActiveAlertsCard.tsx`
- **Purpose:** Shows recent active governance alerts with severity badges and link to forensics.
- **Props:**
  - `data?: AlertItem[]`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** ⚠️ Hardcoded fallback: `[{ id: "INV-440", title: "Data Exfiltration Attempt", severity: "Critical" }, { id: "INV-439", title: "Unsanctioned API Usage", severity: "Warning" }, { id: "INV-438", title: "Hallucination Spike", severity: "Low" }]`.

---

#### RiskBreakdownCard
- **File:** `components/dashboard/RiskBreakdownCard.tsx`
- **Purpose:** Shows 6 risk metrics as percentage bars (Policy Adherence, Behavioral Drift, Tamper Events, RCA Confidence, Escalation Rate, Open Investigations).
- **Props:**
  - `data?: RiskMetric[]`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** ⚠️ Hardcoded `defaultMetrics`: Policy Adherence 96.2%, Behavioral Drift 2.4%, Tamper Events 0, RCA Confidence 91%, Escalation Rate 0.7%, Open Investigations 4.

---

#### IntelligenceDashboard
- **File:** `components/dashboard/IntelligenceDashboard.tsx`
- **Purpose:** Shows violation feed, risk chart, compliance score, threat signals, and active policies.
- **Props:**
  - `data?: IntelligenceData`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/agents/page.tsx`, `app/dashboard/observability/page.tsx`
- **Notes:** ⚠️ Falls back to `demoSignals.violations` (from `lib/demo/demoSignals.ts`). 🔴 **DEAD BUTTONS:** "Generate Audit Report" button has no `onClick`. "Export Verified Evidence Package" button has no `onClick`.

---

#### RecentInvestigationsCard
- **File:** `components/dashboard/RecentInvestigationsCard.tsx`
- **Purpose:** Shows 5 most recent investigation rows with status badges and assignee info.
- **Props:**
  - `data?: InvestigationRow[]`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** ⚠️ Hardcoded `defaultRows`: INV-440 through INV-435 with fake assignees (M. Chen, S. Patel, R. Kim, A. Torres, J. Liu). "View all →" links to `/dashboard/investigations`.

---

#### SimulationWidget
- **File:** `components/dashboard/SimulationWidget.tsx`
- **Purpose:** Compact widget showing simulation run count, average risk score, and last 3 simulation results.
- **Props:**
  - `data: any`
  - `loading: boolean`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/governance/page.tsx`
- **Notes:** Pure display — all data passed from parent. No fallback.

---

#### RiskTrendChart
- **File:** `components/dashboard/RiskTrendChart.tsx`
- **Purpose:** Recharts AreaChart showing risk score trend over time.
- **Props:**
  - `data: any[]`
  - `loading: boolean`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** Falls back to `demoSignals.riskTrend` when `data` is empty.

---

#### GovernanceHealthTimeline
- **File:** `components/dashboard/GovernanceHealthTimeline.tsx`
- **Purpose:** Recharts AreaChart of governance health score over a selected time range (24h / 7d / 30d).
- **Props:**
  - `orgId: string`
- **State:** `data, loading, range`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/dashboard/governance/health-timeline?org_id=${orgId}&range=${range}`
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** Falls back to `demoSignals.riskTrend` when API returns empty. Range toggle buttons are functional.

---

#### AdvancedAnalytics
- **File:** `components/dashboard/AdvancedAnalytics.tsx`
- **Purpose:** Shows 4 analytics charts: Policy Adherence Trend, Governance Dimension Scores, Behavioral Drift Distribution, Audit Trail log.
- **Props:** none
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/observability/page.tsx`
- **Notes:** 🔴 FULLY HARDCODED. Constants: `COMPLIANCE_TREND`, `CATEGORY_SCORES`, `DRIFT_DISTR`. Audit trail is 5 fixed log entries. No live data whatsoever.

---

#### AlertConfiguration
- **File:** `components/dashboard/AlertConfiguration.tsx`
- **Purpose:** Form UI for creating, toggling, and deleting alert rules (metric, operator, threshold, channels).
- **Props:** none
- **State:** `rules, loading, formState (name, metric, operator, threshold, channels)`
- **Hooks:** `useEffect`, `useState`
- **APIs called:**
  - `GET /api/governance/alerts/config` — fetch existing rules
  - `POST /api/governance/alerts/config` — create/toggle rule
  - `DELETE /api/governance/alerts/config?id=${id}` — delete rule
- **DB tables:** alert_rules (via API)
- **Parent pages:** `app/dashboard/alerts/AlertsClient.tsx`
- **Notes:** Fully functional.

---

#### AlertPanel
- **File:** `components/dashboard/AlertPanel.tsx`
- **Purpose:** Real-time alert feed that auto-refreshes every 30 seconds. Named export.
- **Props:** none
- **State:** `alerts, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/alerts` (on mount + every 30s via `setInterval`)
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/alerts/AlertsClient.tsx`
- **Notes:** 🔴 **DEAD BUTTON:** "View Audit History →" has no `onClick` handler. Named export (not default).

---

#### CostAnomalyCard
- **File:** `components/dashboard/CostAnomalyCard.tsx`
- **Purpose:** Shows detected cost spike anomalies from AI provider usage.
- **Props:** none
- **State:** `anomalies, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/economics/cost-anomalies`
- **DB tables:** usage_events (via API)
- **Parent pages:** `app/dashboard/billing/page.tsx`
- **Notes:** No buttons or interactive elements beyond display.

---

#### DashboardFilters
- **File:** `components/dashboard/DashboardFilters.tsx`
- **Purpose:** Filter bar for the main dashboard — date range, model version, channel toggles.
- **Props:**
  - `onFilterChange: (filters: FilterState) => void`
- **State:** `dateRange, modelVersion, channels`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** Fires `onFilterChange` via `useEffect` on every state change. "Live Feed Active" badge is purely decorative (no real-time subscription).

---

#### PredictiveDriftCard
- **File:** `components/dashboard/PredictiveDriftCard.tsx`
- **Purpose:** Shows predictive drift score, momentum, and estimated hours to escalation for a model. Named export.
- **Props:**
  - `model: string`
  - `driftScore: number`
  - `momentum: number`
  - `predictedHours: number`
  - `escalation: boolean`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/governance/page.tsx`
- **Notes:** Pure display. Named export (not default).

---

#### ReportBuilder
- **File:** `components/dashboard/ReportBuilder.tsx`
- **Purpose:** Form for generating and downloading governance reports. Selects metrics, date range, and output format (csv / html).
- **Props:** none
- **State:** `selectedMetrics, dateRange, format, loading`
- **Hooks:** `useState`
- **APIs called:** `POST /api/governance/reports/generate` — downloads blob response
- **DB tables:** governance_events, audit_logs (via API)
- **Parent pages:** `app/dashboard/governance/page.tsx`
- **Notes:** Fully functional. Blob download works via `URL.createObjectURL`.

---

#### RuntimeInterceptsPanel
- **File:** `components/dashboard/RuntimeInterceptsPanel.tsx`
- **Purpose:** Live feed of runtime governance intercepts. Has "Seed Demo" and "Refresh" actions.
- **Props:** none
- **State:** `intercepts, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:**
  - `GET /api/runtime/intercept` — fetch intercepts
  - `GET /api/runtime/intercept?seed=true` — seed demo data
- **DB tables:** governance_intercepts (via API)
- **Parent pages:** `app/dashboard/governance/page.tsx`
- **Notes:** Both buttons functional.

---

#### VoiceDriftCard
- **File:** `components/dashboard/VoiceDriftCard.tsx`
- **Purpose:** Shows voice channel drift score and 30-day trend sparkline.
- **Props:**
  - `data?: VoiceDriftData`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/page.tsx`
- **Notes:** ⚠️ Hardcoded fallback: `{ avg_risk_30d: 0.14, percentage_change: -4.2, trend: [10,15,12,18,...] }`. 🔴 **DEAD LINK:** "View Details →" navigates to `/dashboard/voice/analysis` which does not exist.

---

#### AiGatewayTrafficPanel
- **File:** `components/dashboard/AiGatewayTrafficPanel.tsx`
- **Purpose:** Shows AI provider traffic distribution (pie chart) and latency trend (area chart).
- **Props:** none
- **State:** `data, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:**
  - `GET /api/gateway/ai` — fetch live traffic data
  - `GET /api/gateway/ai?seed=true` — seed demo data
- **DB tables:** ai_gateway_events (via API)
- **Parent pages:** `app/dashboard/observability/page.tsx`
- **Notes:** Both buttons functional.

---

#### ConsistencyHeatmap
- **File:** `components/dashboard/ConsistencyHeatmap.tsx`
- **Purpose:** Shows response consistency heatmap comparing multiple LLM models across prompt categories. Named export.
- **Props:** none
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/observability/page.tsx`
- **Notes:** 🔴 FULLY HARDCODED. 4 hardcoded models (GPT-4o, Claude 3.5 Opus, Gemini 1.5 Pro, Llama 3 70B) with fixed cosine similarity scores. Shows "Confidence: 99.2%" — hardcoded literal. Named export.

---

#### DisasterRecoveryCard
- **File:** `components/dashboard/DisasterRecoveryCard.tsx`
- **Purpose:** Shows disaster recovery status: snapshot integrity, restore readiness, last verification timestamp. Named export.
- **Props:** none
- **State:** `status, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/resilience/dr-status`
- **DB tables:** dr_snapshots (via API)
- **Parent pages:** `app/dashboard/observability/page.tsx`
- **Notes:** Named export.

---

#### EvaluationAnalysis
- **File:** `components/dashboard/EvaluationAnalysis.tsx`
- **Purpose:** Shows governance evaluation results with severity filter, sort, and two Recharts charts (bar + scatter).
- **Props:** none
- **State:** `records, loading, severityFilter, sortKey`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/governance/investigations`
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/governance/page.tsx`
- **Notes:** ⚠️ When API returns empty, shows 5 hardcoded fallback records.

---

#### VoiceRiskScorePanel
- **File:** `components/dashboard/VoiceRiskScorePanel.tsx`
- **Purpose:** Shows voice conversation risk scores and signal breakdown.
- **Props:**
  - `conversationId: string`
  - `orgId: string`
- **State:** `data, loading, error`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/voice/riskScores?conversationId=${conversationId}&orgId=${orgId}`
- **DB tables:** voice_events (via API)
- **Parent pages:** `app/dashboard/observability/page.tsx`
- **Notes:** 🔴 **SECURITY ISSUE:** Request includes hardcoded `'x-api-key': 'dashboard-client-key'` in fetch headers. This key should come from env/auth context, not be hardcoded in client-side code.

---

### forensics/

---

#### BehaviorAnomalySignals
- **File:** `components/forensics/BehaviorAnomalySignals.tsx`
- **Purpose:** Displays behavioral anomaly signal breakdown: intent drift score, confidence, instruction override flag, context saturation.
- **Props:**
  - `signals: BehaviorSignals | null`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Pure display. Handles `null` gracefully.

---

#### ForensicsTimeline
- **File:** `components/forensics/ForensicsTimeline.tsx`
- **Purpose:** Renders a chronological timeline of forensics events with icons per event type.
- **Props:**
  - `events: TimelineEvent[]`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Pure display. Event types: `prompt_submitted`, `governance_decision`, `policy_violation`, `risk_score_calculated`, `system_metrics`, `activity`.

---

#### RcaGraph
- **File:** `components/forensics/RcaGraph.tsx`
- **Purpose:** Renders a root cause analysis causal chain diagram with confidence score.
- **Props:**
  - `root_cause: string`
  - `causal_chain: string[]`
  - `confidence_score: number`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Pure SVG/DOM render. No external dependencies.

---

### incidents/

---

#### GovernanceStory
- **File:** `components/incidents/GovernanceStory.tsx`
- **Purpose:** Generates and displays a human-readable narrative of an incident's governance events.
- **Props:**
  - `incident: IncidentThread`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/incidents/[id]/page.tsx`
- **Notes:** Calls `generateGovernanceStory(incident.events)` from `lib/forensics/governanceStory.ts` (pure function, no API).

---

#### IncidentControls
- **File:** `components/incidents/IncidentControls.tsx`
- **Purpose:** Filter controls (severity, risk threshold, model) wrapping `IncidentTimeline`. Includes a Refresh button.
- **Props:**
  - `incidents: IncidentThread[]`
- **State:** `severityFilter, riskMin, modelFilter`
- **Hooks:** `useState`, `useRouter`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/incidents/page.tsx`
- **Notes:** Refresh uses `router.refresh()` to trigger server component re-fetch. Filters applied client-side.

---

#### IncidentTimeline
- **File:** `components/incidents/IncidentTimeline.tsx`
- **Purpose:** Renders grouped incident threads with event cards, severity badges, timing, and action links.
- **Props:**
  - `incidents: IncidentThread[]`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `components/incidents/IncidentControls.tsx`
- **Notes:** Links to `/dashboard/incidents/${session_id}` (detail page), `/dashboard/forensics?session=`, `/dashboard/replay?session=`. All three destinations exist.

---

### replay/

---

#### ReplayViewer
- **File:** `components/replay/ReplayViewer.tsx`
- **Purpose:** Fetches and renders a session replay timeline with event cards, risk bars, and loading/error states.
- **Props:**
  - `sessionId: string`
- **State:** `events, loading, error`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/sessions/${sessionId}/timeline`
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/replay/page.tsx`
- **Notes:** Expected API response shape: `{ timeline: TimelineEvent[], riskPeaks, policyTriggers }`. Handles loading, error, and empty states cleanly.

---

### session/

---

#### TurnTimeline
- **File:** `components/session/TurnTimeline.tsx`
- **Purpose:** Renders a list of session turns as `TurnCard` components.
- **Props:**
  - `turns: any[]`
  - `onInspect: (turn: any) => void`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx` (session detail views)
- **Notes:** Pure display wrapper over `TurnCard`.

---

#### TurnCard
- **File:** `components/session/TurnCard.tsx`
- **Purpose:** Renders a single session turn with role, content, risk score, and "Inspect RCA" button.
- **Props:**
  - `turn: { id, role, content, turn_index, incremental_risk, factors }`
  - `onInspect: (turn: any) => void`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `components/session/TurnTimeline.tsx`
- **Notes:** "Inspect RCA" button calls `onInspect(turn)` — delegates to parent (`RcaDrawer`). Uses Framer Motion for animation.

---

#### SessionRadar
- **File:** `components/session/SessionRadar.tsx`
- **Purpose:** Renders a radar chart showing per-factor risk scores for a session.
- **Props:**
  - `factors: Record<string, number>`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Pure SVG radar chart. Uses `CountUp` for value animation.

---

#### RcaDrawer
- **File:** `components/session/RcaDrawer.tsx`
- **Purpose:** Slide-out drawer showing root cause analysis for a specific session turn.
- **Props:**
  - `sessionId: string`
  - `turn: any | null`
  - `onClose: () => void`
- **State:** `data, loading`
- **Hooks:** `useEffect`, `useState`
- **APIs called:** `GET /api/forensics/rca/${sessionId}` (when `turn && sessionId`)
- **DB tables:** governance_events (via API)
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Uses Framer Motion AnimatePresence for slide animation.

---

#### DriftIndicator
- **File:** `components/session/DriftIndicator.tsx`
- **Purpose:** Simple colored bar showing drift percentage for a session.
- **Props:**
  - `drift: number`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/forensics/page.tsx`
- **Notes:** Pure display. Color: green < 20, yellow < 50, red ≥ 50.

---

### setup/

---

#### ConnectionWizard
- **File:** `components/setup/ConnectionWizard.tsx`
- **Purpose:** 5-step wizard for connecting an AI provider: Interaction Type → Provider → BYOK Config → Connection Test → Done.
- **Props:** none
- **State:** `step, provider, byokKey, testResult, loading`
- **Hooks:** `useState`, `useInteractionMode` (Zustand)
- **APIs called:**
  - `POST /api/integrations/connect` — establish connection
  - `POST /api/governance/evaluate` — run test evaluation
- **DB tables:** integrations, governance_events (via API)
- **Parent pages:** `app/dashboard/connect/page.tsx`
- **Notes:** ⚠️ **HARDCODED org_id:** `org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc'` is passed in `runTest()`. Should be sourced from auth session. Uses `useInteractionMode()` Zustand store.

---

### playground/

---

#### GovernanceResults
- **File:** `components/playground/GovernanceResults.tsx`
- **Purpose:** Displays governance evaluation results from a playground run: decision, risk score, violations, behavior signals, pipeline stage logs.
- **Props:**
  - `data: any | null`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/playground/page.tsx`
- **Notes:** ⚠️ Pipeline stage log labels are hardcoded "SUCCESS" / "CLEAN" / "DONE" — not derived from API response. Shows misleading constant success state.

---

#### PromptRunner
- **File:** `components/playground/PromptRunner.tsx`
- **Purpose:** Form for submitting a prompt to the governance playground: prompt text, model selector, temperature slider.
- **Props:**
  - `onRun: (config: { prompt, model, temperature }) => Promise<void>`
  - `loading: boolean`
- **State:** `prompt, model, temperature`
- **Hooks:** `useState`
- **APIs called:** none (calls `onRun` prop)
- **DB tables:** none
- **Parent pages:** `app/dashboard/playground/page.tsx`
- **Notes:** Pure form. API call delegated to parent page.

---

### simulation/

---

#### ScenarioSelector
- **File:** `components/simulation/ScenarioSelector.tsx`
- **Purpose:** Form for selecting a simulation scenario, configuring volume, and triggering a run.
- **Props:**
  - `selectedId: string`
  - `onSelect: (id: string) => void`
  - `volume: number`
  - `onVolumeChange: (v: number) => void`
  - `onRun: () => void`
  - `loading: boolean`
- **State:** none
- **Hooks:** `useInteractionMode` (Zustand)
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/simulation/page.tsx`
- **Notes:** Uses `SCENARIOS` constant from `lib/testing/scenarios.ts`. Uses `useInteractionMode()` Zustand to show mode badge.

---

### layout/

---

#### ComingSoonBlock
- **File:** `components/layout/ComingSoonBlock.tsx`
- **Purpose:** Placeholder block shown for features not yet activated. Shows module name, status, and optional activation message.
- **Props:**
  - `moduleName: string`
  - `status: string`
  - `activationMessage?: string`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** Various dashboard pages for unactivated modules
- **Notes:** ⚠️ Shows "Phase 4 Activation Level" with a 25% progress bar — this value is hardcoded, not dynamic.

---

#### DashboardSidebar
- **File:** `components/layout/DashboardSidebar.tsx`
- **Purpose:** Primary navigation sidebar with route links, section grouping, and active state highlighting.
- **Props:** none (uses `usePathname`)
- **State:** `collapsed`
- **Hooks:** `usePathname`, `useState`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/layout.tsx`
- **Notes:** Route list is statically defined. Collapse state is local (not persisted).

---

#### EnterpriseTopbar
- **File:** `components/layout/EnterpriseTopbar.tsx`
- **Purpose:** Top navigation bar with org name, user info, notifications bell, and global search trigger.
- **Props:** none
- **State:** `notifications`
- **Hooks:** `useState`, possibly `useUser`/`useSession`
- **APIs called:** possibly `GET /api/notifications` (review required)
- **DB tables:** unknown
- **Parent pages:** `app/dashboard/layout.tsx`
- **Notes:** Embeds `GlobalSearch` component.

---

### onboarding/

---

#### QuickStart
- **File:** `components/onboarding/QuickStart.tsx`
- **Purpose:** Modal overlay onboarding wizard shown to new users. 4-step flow: Connect → Policy → Test → Dashboard.
- **Props:** none
- **State:** `dismissed` (local)
- **Hooks:** `useState`, `useOnboardingState` (custom hook)
- **APIs called:** none directly (hook may call API)
- **DB tables:** depends on `useOnboardingState` implementation
- **Parent pages:** `app/dashboard/layout.tsx` or `app/dashboard/page.tsx`
- **Notes:** Navigation via `window.location.href` (hard navigation, not `router.push`). Dismissible. Step state managed by `hooks/useOnboardingState.ts`.

---

### billing/

---

#### BillingCycleToggle
- **File:** `components/billing/BillingCycleToggle.tsx`
- **Purpose:** Monthly / Annual billing toggle with animated slider and "2 Months Free" badge.
- **Props:**
  - `value: 'monthly' | 'annual'`
  - `onChange: (value: 'monthly' | 'annual') => void`
- **State:** none
- **Hooks:** none
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `app/dashboard/billing/page.tsx`
- **Notes:** Pure UI toggle. "Save 20%" badge visible only when annual is selected (CSS opacity transition).

---

### ui/

---

#### GlobalSearch
- **File:** `components/ui/GlobalSearch.tsx`
- **Purpose:** Cmd+K command palette for navigating between dashboard routes.
- **Props:** none
- **State:** `isOpen, query`
- **Hooks:** `useEffect`, `useState`, `useRouter`, `useRef`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** `components/layout/EnterpriseTopbar.tsx`
- **Notes:** ⚠️ `SEARCH_ROUTES` array of 8 routes is hardcoded — not sourced from `config/navigation.ts`. 🔴 **DEAD LINK:** Includes `/dashboard/analysis` which does not exist (should be `/dashboard/observability` or `/dashboard/agents`).

---

#### ThreatReplayPanel
- **File:** `components/ui/ThreatReplayPanel.tsx`
- **Purpose:** Slide-out panel showing a step-by-step replay of a threat scenario with Play/Pause/Step/Reset controls.
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
- **State:** `playing, currentStep, intervalRef`
- **Hooks:** `useState`, `useEffect`, `useRef`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** unknown (modal trigger not found in scanned files)
- **Notes:** 🔴 FULLY HARDCODED. All 5 event steps are fixed constants with timestamps 14:22:01–14:22:16 and hardcoded descriptions. Play/Pause/Step/Reset animate through this fake data only. No real replay capability.

---

#### CountUp
- **File:** `components/ui/CountUp.tsx`
- **Purpose:** Animated number counter that counts from 0 to a target value over a configurable duration.
- **Props:**
  - `end: number`
  - `duration?: number`
  - `decimals?: number`
  - `suffix?: string`
- **State:** `count`
- **Hooks:** `useEffect`, `useState`, `useRef`
- **APIs called:** none
- **DB tables:** none
- **Parent pages:** ExecutiveHealthCard, GovernanceSnapshotCard, SessionRadar, and others
- **Notes:** Pure utility component. `requestAnimationFrame`-based animation.

---

## §2 — Fully Hardcoded Components

These components render no live data — all values are compile-time constants.

| Component | File | What's hardcoded |
|---|---|---|
| GovernanceSnapshotCard | `components/dashboard/GovernanceSnapshotCard.tsx` | Phase coverage %, System Integrity labels, 30-day session/escalation/SLA counts |
| AdvancedAnalytics | `components/dashboard/AdvancedAnalytics.tsx` | All 4 charts (COMPLIANCE_TREND, CATEGORY_SCORES, DRIFT_DISTR, audit log entries) |
| ConsistencyHeatmap | `components/dashboard/ConsistencyHeatmap.tsx` | 4 model names, all similarity scores, "Confidence: 99.2%" |
| ThreatReplayPanel | `components/ui/ThreatReplayPanel.tsx` | All 5 scenario steps with fixed timestamps and descriptions |
| GovernanceResults (pipeline logs) | `components/playground/GovernanceResults.tsx` | Pipeline stage labels ("SUCCESS"/"CLEAN"/"DONE") — always shown as success |

### Components with partial hardcoded fallbacks (render demo data when no prop/API data):

| Component | Fallback source |
|---|---|
| ExecutiveHealthCard | Inline object literal in component |
| ActiveAlertsCard | Inline `defaultAlerts` array (INV-440/439/438) |
| RiskBreakdownCard | Inline `defaultMetrics` array |
| RecentInvestigationsCard | Inline `defaultRows` array (M. Chen etc.) |
| DriftTrendCard | Inline fallback + `Math.random()` chart bars |
| VoiceDriftCard | Inline fallback `{ avg_risk_30d: 0.14 }` |
| IntelligenceDashboard | `demoSignals.violations` from `lib/demo/demoSignals.ts` |
| RiskTrendChart | `demoSignals.riskTrend` |
| GovernanceHealthTimeline | `demoSignals.riskTrend` |
| EvaluationAnalysis | 5 inline hardcoded records |

---

## §3 — Components That Call APIs Directly

These components own their own data fetching via `useEffect` rather than receiving data from a parent page/layout:

| Component | API endpoint(s) | Method |
|---|---|---|
| GovernanceStateCard | `/api/governance/state?orgId=` | GET |
| DriftTrendCard | `/api/governance/drift?days=` | GET |
| GovernanceHealthTimeline | `/api/dashboard/governance/health-timeline` | GET |
| AlertConfiguration | `/api/governance/alerts/config` | GET, POST, DELETE |
| AlertPanel | `/api/alerts` | GET (+ 30s interval) |
| CostAnomalyCard | `/api/economics/cost-anomalies` | GET |
| EvaluationAnalysis | `/api/governance/investigations` | GET |
| VoiceRiskScorePanel | `/api/voice/riskScores` | GET |
| AiGatewayTrafficPanel | `/api/gateway/ai` | GET |
| DisasterRecoveryCard | `/api/resilience/dr-status` | GET |
| ReplayViewer | `/api/sessions/${sessionId}/timeline` | GET |
| RcaDrawer | `/api/forensics/rca/${sessionId}` | GET |
| RuntimeInterceptsPanel | `/api/runtime/intercept` | GET |
| ReportBuilder | `/api/governance/reports/generate` | POST |
| ConnectionWizard | `/api/integrations/connect`, `/api/governance/evaluate` | POST |

---

## §4 — Dead Buttons & Dead Links

### Dead Buttons (button elements with no `onClick`)

| Component | Button label | Location |
|---|---|---|
| IntelligenceDashboard | "Generate Audit Report" | `components/dashboard/IntelligenceDashboard.tsx` |
| IntelligenceDashboard | "Export Verified Evidence Package" | `components/dashboard/IntelligenceDashboard.tsx` |
| AlertPanel | "View Audit History →" | `components/dashboard/AlertPanel.tsx` |

### Dead Links (navigation targets that don't exist)

| Component | Link target | Correct target |
|---|---|---|
| VoiceDriftCard | `/dashboard/voice/analysis` | No equivalent page found |
| GlobalSearch | `/dashboard/analysis` | Likely `/dashboard/observability` or `/dashboard/agents` |

---

## §5 — Security & Quality Issues

| Issue | Severity | Component | Detail |
|---|---|---|---|
| Hardcoded API key in client code | **HIGH** | VoiceRiskScorePanel | `'x-api-key': 'dashboard-client-key'` sent in fetch headers — visible in browser devtools |
| Hardcoded org ID in component | **MEDIUM** | ConnectionWizard | `org_id: 'dbad3ca2-3907-4279-9941-8f55c3c0efdc'` used in `runTest()` |
| Hardcoded org ID at call site | **MEDIUM** | GovernanceStateCard | Caller passes `orgId="demo-org-123"` |
| Non-deterministic chart rendering | **LOW** | DriftTrendCard | Mini bar chart uses `Math.random()` — different on every render |
| Hard navigation in onboarding | **LOW** | QuickStart | Uses `window.location.href` instead of `router.push()` |

---

## §6 — API Endpoints Referenced (Full List)

| Endpoint | Method | Component |
|---|---|---|
| `/api/governance/state` | GET | GovernanceStateCard |
| `/api/governance/drift` | GET | DriftTrendCard |
| `/api/dashboard/governance/health-timeline` | GET | GovernanceHealthTimeline |
| `/api/governance/alerts/config` | GET, POST, DELETE | AlertConfiguration |
| `/api/alerts` | GET | AlertPanel |
| `/api/economics/cost-anomalies` | GET | CostAnomalyCard |
| `/api/governance/investigations` | GET | EvaluationAnalysis |
| `/api/voice/riskScores` | GET | VoiceRiskScorePanel |
| `/api/gateway/ai` | GET | AiGatewayTrafficPanel |
| `/api/resilience/dr-status` | GET | DisasterRecoveryCard |
| `/api/sessions/${id}/timeline` | GET | ReplayViewer |
| `/api/forensics/rca/${id}` | GET | RcaDrawer |
| `/api/runtime/intercept` | GET | RuntimeInterceptsPanel |
| `/api/governance/reports/generate` | POST | ReportBuilder |
| `/api/integrations/connect` | POST | ConnectionWizard |
| `/api/governance/evaluate` | POST | ConnectionWizard |

---

## §7 — Zustand Store Usage

| Store / Hook | Used by |
|---|---|
| `useInteractionMode()` | ConnectionWizard, ScenarioSelector |
| `useOnboardingState()` | QuickStart |

---

## §8 — Shared Utility Dependencies

| Utility | Used by |
|---|---|
| `components/ui/CountUp.tsx` | ExecutiveHealthCard, GovernanceSnapshotCard, SessionRadar |
| `lib/demo/demoSignals.ts` | IntelligenceDashboard, RiskTrendChart, GovernanceHealthTimeline |
| `lib/metrics/healthConfidence.ts` | ExecutiveHealthCard |
| `lib/forensics/governanceStory.ts` | GovernanceStory |
| `lib/testing/scenarios.ts` | ScenarioSelector |

---

*End of Component Audit — 45 components catalogued across 15 subdirectories.*
