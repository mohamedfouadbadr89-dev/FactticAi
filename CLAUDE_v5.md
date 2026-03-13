# FACTTIC.AI — MASTER CONTEXT FILE v5
# LAST UPDATED: March 3, 2026
# READ THIS FIRST. DO NOT SKIP. DO NOT DUPLICATE EXISTING CODE.

## ════════════════════════════════════════════════
## WHAT IS FACTTIC?
## ════════════════════════════════════════════════
AI Governance Platform — monitors AI agent behavior (Chat + Voice) in production.
Detects risk, drift, hallucinations, policy violations.
Governance scoring is DETERMINISTIC + cryptographically signed.
Target: B2B SaaS for enterprises building on LLMs and Voice AI.
Differentiator: Governance-FIRST (not observability-first). Covers BOTH Chat AND Voice.
Positioning: Built from Governance → Observability (competitors go Observability → Governance)
Billing Unit: EU (Evaluation Unit) = 1 AI turn evaluated via POST /api/governance/evaluate
Tiers: Starter $99/mo 50k EU / Growth $299/mo 250k EU / Enterprise custom
Market: $227M in 2024 → $4.83B by 2034
Competitors: Coval, Hamming, Roark, Cekura, Bluejay, Helicone, Langfuse, Arize, Braintrust, Fiddler

## ════════════════════════════════════════════════
## ENVIRONMENT — CONNECTIONS
## ════════════════════════════════════════════════
GitHub Repo:    mohamedfouadbadr89-dev/FactticAi (private)
Hosting:        Hostinger VPS — connected to GitHub (auto-deploy)
Database:       Supabase cloud — connected to AntiGravity IDE
IDE:            AntiGravity — has direct Supabase access

GitHub Tags (version history):
  v1.0.0                    — last week (baseline)
  v1.1.0-constitution-locked — last week (documentation constitution locked)
  v1.1.0-enterprise-hardened — last week (enterprise hardening)
  v1.2.0-governance-closure  — 3 days ago (LATEST — governance phase closed)

## ════════════════════════════════════════════════
## TECH STACK
## ════════════════════════════════════════════════
- Next.js 16.1.6 + TypeScript (App Router, Turbopack)
- Supabase (PostgreSQL + RLS + RPCs) — Single Source of Truth
- Redis (ioredis — optional, falls back to in-memory EventEmitter via signalBus)
- Tailwind CSS + shadcn/ui

## ════════════════════════════════════════════════
## CORE PRINCIPLES — NEVER VIOLATE
## ════════════════════════════════════════════════
1. Stability — never break existing migrations or core schema (FROZEN since v1.1.0)
2. Isolation — every DB query must filter by org_id (RLS enforced)
3. Deterministic Logic — scoring must be reproducible, no randomness
4. Single Source of Truth — all logic in Supabase RPCs/lib, not frontend
5. One Feature at a Time — complete end-to-end before moving on
6. Never edit existing migration files — create NEW ones only
7. Always: authenticate → resolve org → filter by org_id in every API route
8. Don't rebuild what exists — check this file first, then audit the code

## ════════════════════════════════════════════════
## SUPABASE CLIENTS — USE CORRECTLY
## ════════════════════════════════════════════════
- lib/supabaseAuth.ts    → createServerAuthClient()  — USE for session/auth in API routes
- lib/supabaseServer.ts  → supabaseServer (svc role) — USE for DB queries in API routes
- lib/supabaseClient.ts  → browser client            — USE in client components ONLY
- lib/supabase.ts        → LEGACY, AVOID
- lib/supabaseService.ts → SERVICE ROLE ALIAS, AVOID

AUTH PATTERN (every API route):
  const supabase = await createServerAuthClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { org_id: orgId } = await resolveOrgContext(session.user.id)

## ════════════════════════════════════════════════
## IMPORTANT: UI ≠ PHASES
## ════════════════════════════════════════════════
Homepage, Login page, Dashboard = UI containers. NOT phases.
Phases = governance features themselves.
Bugs in UI containers = tracked as bugs inside Phase 11.

## ════════════════════════════════════════════════
## KNOWN CRITICAL BUGS (fix before new phases)
## ════════════════════════════════════════════════
B1 — CRITICAL: app/login/page.tsx does NOT exist → BLOCKS ALL USERS
               app/api/auth/callback/route.ts missing

B2 — HIGH:     app/page.tsx redirects to /login when no session
               app/(marketing)/page.tsx is BUILT (20+ components) but unreachable

B3 — HIGH:     useDashboardData() always uses FALLBACK hardcoded data
               Never calls real governance APIs

B4 — MEDIUM:   Alerts/investigations empty (EXPECTED — no evaluations sent yet)

## ════════════════════════════════════════════════
## SINGLE INTEGRATION POINT
## ════════════════════════════════════════════════
Everything flows through: POST /api/governance/evaluate
  Input:  { interaction_id, agent_id, session_id, payload }
  Output: { evaluation, signature, risk_score, factors }

4-Factor Scoring (deterministic, frozen):
  hallucination 0.35 + tone 0.25 + drift 0.20 + confidence 0.20

When evaluations flow → Phases 3–8 activate automatically.

Voice Integration Targets (clients use these):
  Vapi        → POST /api/governance/evaluate (after each turn)
  Retell AI   → POST /api/governance/evaluate (after each turn)
  ElevenLabs  → POST /api/governance/evaluate (post-stream)
  Pipecat     → POST /api/governance/evaluate (pipeline hook)

Chat Integration Targets:
  OpenAI, Anthropic, custom → POST /api/governance/evaluate

Webhook:
  POST /api/webhooks/ingest (exists, needs testing)

## ════════════════════════════════════════════════
## 15-PHASE STRUCTURE (based on codebase audit)
## ════════════════════════════════════════════════

PHASE 1  — FOUNDATION ✅ COMPLETE
  Auth, RBAC, 4-factor scoring engine, HMAC signing, org isolation
  Locked since v1.1.0-enterprise-hardened

PHASE 2  — CORE EVALUATION PIPELINE ✅ COMPLETE
  POST /api/governance/evaluate — full flow
  Closed in v1.2.0-governance-closure

PHASE 3  — DRIFT DETECTION ✅ BUILT (needs real data)
  Timeseries view, trend API, drift_alerts table
  Shows "Baseline Pending" until evaluations flow

PHASE 4  — ALERTS PIPELINE ✅ BUILT (empty until data)
  GET /api/governance/alerts, governance_escalation_log

PHASE 5  — RCA + INVESTIGATIONS ✅ BUILT (empty until data)
  GET /api/governance/investigations, governance_root_cause_reports

PHASE 6  — DETERMINISM + CERTIFICATION ✅ COMPLETE
  Replay RPC, verify-evaluation RPC, certification view, HMAC chain

PHASE 7  — PREDICTIVE ANALYTICS ✅ BUILT (dashboard needs wiring)
  Composite health, momentum, acceleration, projection APIs
  Dashboard shows HARDCODED FALLBACK — must wire to real APIs

PHASE 8  — REAL-TIME STREAMING ✅ COMPLETE
  SSE via GET /api/governance/stream, Redis pub/sub + in-memory fallback

PHASE 9  — TRUST + COMPLIANCE 🟡 PARTIAL
  5 trust endpoints built. /dashboard/compliance exists but not connected.

PHASE 10 — WEBHOOK + INTEGRATION LAYER 🟡 PARTIAL
  POST /api/webhooks/ingest exists. No SDK or documentation published.

PHASE 11 — CLIENT ONBOARDING 🔴 BLOCKING (Bugs B1-B4)
  POST /api/org/create exists (RBAC: owner)

PHASE 12 — BILLING + EU QUOTA 🔴 NOT CONNECTED
  UI at /dashboard/billing. POST /api/billing/record exists (RBAC: member).
  Stripe NOT connected. No EU tracking. No 402 enforcement.

PHASE 13 — VOICE GOVERNANCE 🔴 NOT BUILT
  UI at /dashboard/voice. No voice-specific evaluation logic.
  Voice needs: turn latency, interruptions, TTS quality, barge-in scoring.
  Target providers: Vapi, Retell AI, ElevenLabs, Pipecat.

PHASE 14 — ADVANCED INTELLIGENCE 🔴 NOT CONNECTED
  40+ engine files in core/governance/ (arrForecastEngine, auditWindowManager,
  evidenceBundleExporter, executiveRiskReportGenerator, rfpResponseEngine, etc.)
  /dashboard/intelligence exists. NONE connected to APIs.

PHASE 15 — ENTERPRISE 🔴 NOT STARTED
  SSO/SAML, multi-region data residency, custom compliance, dedicated infra.

## ════════════════════════════════════════════════
## API INVENTORY (16 governance routes)
## ════════════════════════════════════════════════
POST /api/governance/evaluate       ← MAIN ENTRY POINT
GET  /api/governance/alerts
GET  /api/governance/stream         ← SSE real-time
GET  /api/governance/snapshot
GET  /api/governance/drift/*
GET  /api/governance/investigations
GET  /api/governance/trust/*        (5 endpoints)
GET  /api/governance/replay
GET  /api/governance/certify
GET  /api/governance/trend
POST /api/billing/record
POST /api/webhooks/ingest
POST /api/org/create
GET  /api/governance/health

## ════════════════════════════════════════════════
## DOCUMENTATION CONSTITUTION — LOCKED v1
## ════════════════════════════════════════════════
# Locked at tag: v1.1.0-constitution-locked
# This is the traceability and audit infrastructure.
# GDPR compliance and SOC 2 audit readiness are OUTPUT of this system.
# No phase is CLOSED without compliance.

WHY THIS EXISTS:
  The constitution produces structured, verifiable evidence that auditors and
  regulators can inspect. Each requirement below maps to a compliance target:

  GDPR Art. 17 (Right to Erasure)    → Data lifecycle docs + erasure evidence
  GDPR Art. 30 (Records of Processing) → Audit trail + session tamper proofs
  SOC 2 Availability                 → RTO/RPO docs + DR simulation evidence
  SOC 2 Confidentiality              → RLS proof screenshots + BYOK model docs
  SOC 2 Integrity                    → HMAC signing proofs + determinism screenshots
  Investor / Enterprise Audit        → Phase verification + evidence INDEX per phase

OFFICIAL FOLDER STRUCTURE (LOCKED — no alternatives):
  /docs/governance    → CORE_EXECUTION_CHARTER, ENGINE_VS_SURFACE_DECLARATION, FREEZE_ZONES
                        PRODUCT_BASELINE, POLICY_ENGINE_CONSTITUTION
  /docs/architecture  → PHASE_X_ARCHITECTURE_BRIEF, DATA_FLOW_MODEL,
                        WEBHOOK_IDEMPOTENCY_DESIGN, SESSION_ROUTE_DESIGN
  /docs/security      → RLS_PROOF, KEY_ROTATION_POLICY, SECURITY_HEADERS,
                        THREAT_MODEL, BYOK_MODEL
  /docs/billing       → BILLING_RPC_ARCHITECTURE, EU_CALCULATION_MODEL,
                        STRIPE_USAGE_FLOW, HARD_CAP_POLICY
  /docs/compliance    → GDPR_ALIGNMENT_MATRIX, SOC2_ALIGNMENT_OVERVIEW,
                        DATA_RESIDENCY_POLICY, PII_REDACTION_POLICY
  /docs/verification  → PHASE_X_VERIFICATION documents ONLY
  /docs/investor      → investor-facing materials
  /docs/product       → product documentation
  /evidence/phase_X_name/ → screenshots + INDEX.md (mandatory per phase)

NAMING CONVENTION (MANDATORY):
  General docs:     FACTTIC_{CATEGORY}_{NAME}_v{X}.md
  Phase verify:     PHASE_{N}_{SHORT_NAME}_VERIFICATION.md
  Examples:         FACTTIC_GOVERNANCE_CORE_VALIDATION_v1.md
                    PHASE_1_CORE_ENGINE_VALIDATION_VERIFICATION.md

EVIDENCE REQUIREMENTS (per phase):
  Each /evidence/phase_X/ MUST contain:
    - Descriptively named .png screenshots
    - INDEX.md listing every screenshot with what it proves

PHASE CLOSURE RULE — ALL REQUIRED:
  ✓ Engine validated (DB + RPC + API proof)
  ✓ Org isolation proven (RLS screenshot)
  ✓ Determinism proven (if scoring involved)
  ✓ Evidence stored in /evidence/phase_X/
  ✓ Verification document in /docs/verification/
  ✓ INDEX.md present in evidence folder

  UI presence    = NOT proof
  Logs alone     = NOT proof
  Verbal confirm = NOT proof

## ════════════════════════════════════════════════
## FULL FEATURE SCOPE (3 Levels)
## ════════════════════════════════════════════════

# LEVEL 1 — EXISTS IN CODEBASE NOW:
Core Evaluation Pipeline ✅
4-Factor Deterministic Risk Scoring ✅
HMAC Cryptographic Signing ✅
Drift Detection + Alerts Engine ✅
Root Cause / RCA Layer ✅
Health Snapshot API ✅
Org Isolation (RLS) ✅
RBAC ✅
Real-Time Streaming (SSE) ✅
Replay + Certification ✅
Predictive Analytics engine ✅ (not wired to UI yet)
Trust + Compliance APIs ✅ (not wired to UI yet)
Webhook Ingest ✅ (needs testing)
Billing endpoint ✅ (Stripe not connected)

# LEVEL 2 — TO BUILD (Phases 13-15 + wiring):

## GOVERNANCE CORE — ADVANCED INTELLIGENCE
- Model Version Drift Detection
- Prompt & Config Integrity Hashing
- Environment Snapshot Hashing
- Response Fingerprint Indexing
- Cross-Session Hallucination Pattern Detection
- Silent Regression Detection
- Risk Momentum Scoring
- Cross-Agent Systemic Anomaly Detection
- Predictive Drift Escalation Engine

## SECURITY & TAMPER-PROOF LAYER
- Immutable Audit Log Export (Cryptographic Signature)
- Session Tamper Detection Flagging
- Dual-Key BYOK Encryption Model
- Agent Version Integrity Lock
- Secure Event Hash Ledger
- Audit Log Integrity Verification API

## BILLING & USAGE INTELLIGENCE
- EU Burn Rate Forecast Engine
- End-of-Cycle Usage Prediction
- Hard Cap Breach Forecasting
- Anomalous Billing Spike Detection
- Billing Event Hash Idempotency Enforcement
- Deterministic Usage Drift Alerts

## VOICE GOVERNANCE EXTENSIONS
- Interruption Risk Metric (Barge-In Failure Rate)
- Over-Talk Collision Index
- Voice Latency Drift Heatmap
- Audio Stream Integrity Monitoring
- Post-Call Risk Re-Scoring

## COMPLIANCE & DATA INTELLIGENCE
- Data Residency Tagging per Session
- PII Exposure Heatmap
- Sensitive Entity Frequency Monitoring
- Compliance Drift Alerts
- Automated Compliance Evidence Export

## ENTERPRISE OBSERVABILITY EXTENSIONS
- Real-Time Governance Health Stream API
- Org-Scoped Risk Telemetry Feed
- Concurrency Stress Visibility Layer
- Governance Health Snapshot API
- Systemic Risk Propagation Mapping

## PLATFORM RESILIENCE ENHANCEMENTS
- Provider Drift Detection (LLM Behavior Shift)
- Fail-Closed Integrity Confirmation Layer
- Chaos Simulation Hooks (Internal Testing Mode)
- Governance Integrity Self-Check Routine
- Structural Drift Index Monitor

## COMPETITIVE DIFFERENTIATORS (STRUCTURAL)
- Freeze Zone Enforcement Engine
- Org-Scoped Idempotency Enforcement
- Deterministic Governance Scoring Layer
- Governance Event Fingerprinting
- Risk Acceleration Detection Model

# LEVEL 3 — ENTERPRISE (12-24 months):

## DATA GOVERNANCE & LIFECYCLE CONTROL
- Data Retention Policy Engine (Configurable per Org)
- Automated Data Expiry & Secure Deletion Scheduler
- Session Archival Tiering (Hot / Warm / Cold Storage)
- Right-to-Erasure Execution Tracker (GDPR Article 17)
- Data Access Audit Trail Viewer

## DISASTER RECOVERY & CONTINUITY
- Backup Snapshot Automation (DB + Config)
- Point-in-Time Restore Support
- RTO / RPO Definition & Monitoring
- Disaster Recovery Simulation Mode
- Governance Recovery Integrity Verification

## SECURE SDLC & CODE GOVERNANCE
- Secure Deployment Pipeline Validation
- Schema Drift Detection Engine
- Migration Integrity Checkpoint System
- Freeze Zone Auto-Verification Hook
- Configuration Integrity Scanner

## ADVANCED MODEL GOVERNANCE
- Provider SLA Monitoring
- Model Performance Degradation Detector
- Temperature / Parameter Drift Monitor
- Cross-Model Consistency Comparator
- AI Provider Failover Readiness Layer

## OPERATIONAL INCIDENT INTELLIGENCE
- Automated Incident Classification Engine
- Risk Escalation Workflow Automation
- Governance Event Severity Scoring
- Alert Noise Suppression Logic
- Post-Incident Root Cause Template Generator

## ENTERPRISE CONTROL EXTENSIONS
- Org-Level Feature Entitlement Engine
- Role-Level Policy Enforcement Matrix
- Delegated Admin Governance Layer
- Org Risk Threshold Customization
- Governance Policy Versioning System

## ADVANCED OBSERVABILITY
- OpenTelemetry-Compatible Event Stream
- Governance Event Time-Series API
- Real-Time Scoring Latency Tracker
- Drift-to-Incident Correlation Engine
- Governance Health Composite Index

## INFRASTRUCTURE HARDENING
- Secrets Vault Integration Layer
- Automated Key Rotation Scheduler
- Environment Parity Validator (Dev / Staging / Prod)
- Infrastructure Drift Monitor
- Configuration Lock Mode

## ECONOMIC DEFENSE LAYER
- Abuse Detection Engine (EU Flood Protection)
- Sandbox Isolation Guard
- Trial Exploit Pattern Detection
- Cost Anomaly Intelligence
- Governance Load Cost Optimizer

## AI BEHAVIOR FORENSICS LAYER
- Conversation Intent Drift Analyzer
- Context Window Saturation Monitor
- Instruction Override Detection Engine
- System Prompt Boundary Violation Detector
- Response Confidence Scoring Layer
- Agent Behavioral Baseline Profiler

## TRUST & VERIFIABILITY LAYER
- Governance Proof Snapshot Generator
- Risk Score Reproducibility Engine
- Scoring Determinism Validator
- Session Integrity Checksum
- Third-Party Audit Readiness Export

## POLICY ENGINE EXTENSIONS
- Custom Org Governance Rules Engine
- Risk Threshold Automation Policies
- Conditional Escalation Triggers
- Automated Agent Kill-Switch Policy
- Governance Policy Simulation Mode

## HUMAN-IN-THE-LOOP CONTROL
- Manual Override Logging
- Escalation Queue for Flagged Sessions
- Governance Review Assignment Workflow
- Reviewer Confidence Feedback Loop
- Agent Re-Training Trigger Hook

## CROSS-ORG INTELLIGENCE (ISOLATED)
- Anonymized Global Risk Benchmark Index
- Industry Risk Distribution Heatmap (Opt-In)
- Systemic Threat Pattern Detector
- Emerging Hallucination Cluster Monitor
- Governance Threat Early Warning Feed

## AI COST & EFFICIENCY INTELLIGENCE
- Token Consumption Analytics
- Cost-per-Risk Ratio Index
- Risk-to-EU Efficiency Score
- Model Cost Optimization Advisor
- Drift-Cost Correlation Engine

## ADVANCED MULTI-AGENT CONTROL
- Agent Dependency Mapping
- Agent Interaction Risk Matrix
- Cross-Agent Escalation Tracking
- Shared Context Contamination Monitor
- Multi-Agent Failure Propagation Guard

## GOVERNANCE MATURITY INDEX
- Org Governance Maturity Score
- Governance Adoption Depth Index
- Policy Coverage Ratio
- Drift Stabilization Score
- Operational Resilience Grade

## PRODUCT FEATURES (market-validated):
- Root Cause / Drill-down (RCA) ✅
- Hallucination detection / index ✅
- Tone / sentiment / empathy signals ✅
- CI/CD regression testing (eval suites)
- Scenario simulation (synthetic conversations)
- Stress / load testing (concurrency)
- Barge-in / interruption handling (Voice — Phase 13)
- Audio playback / recording support (Voice — Phase 13)
- Live transcript (stream or post-call)
- Production monitoring / live dashboard ✅
- Alerts (thresholds) + notifications ✅
- Session replay / conversation timeline
- Exportable reports (PDF/CSV)
- Role-based access / SSO (RBAC ✅ — SSO Phase 15)
- PII controls / redaction (Phase 14)
- Compliance signals (SOC2/HIPAA) (Phase 9 + docs)
- Self-host / VPC / on-prem option (Phase 15)
- Sandbox (Voice / Chat) (Phase 13 + Phase 10)
- GDPR and SOC compliance (docs + Phase 9)

## ════════════════════════════════════════════════
## EXECUTION ORDER
## ════════════════════════════════════════════════
1. Fix B1 — Create login page (BLOCKS ALL USERS)
2. Fix B2 — Fix homepage routing
3. Fix B3 — Wire dashboard to real APIs
4. Phase 12 — Connect Stripe billing
5. Phase 13 — Voice governance (Vapi, Retell AI, ElevenLabs, Pipecat)
6. Phase 14 — Wire Advanced Intelligence engine to APIs/UI
7. Phase 15 — Enterprise (SSO, multi-region, self-host)

## ════════════════════════════════════════════════
## SECURITY REMINDER
## ════════════════════════════════════════════════
EXPOSED API KEY: Anthropic API key was exposed in terminal output.
ACTION REQUIRED: Revoke at console.anthropic.com → create new key.
