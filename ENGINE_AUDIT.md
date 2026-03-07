# Facttic AI — Backend Engine Layer Audit
**Branch:** product-refactor
**Date:** 2026-03-08
**Scope:** `lib/` — all engine modules
**Auditor:** Claude Code (automated scan + analysis)

---

## Full Engine Request Pipeline

```
Incoming Request (prompt + org_id + session_id)
          │
          ▼
┌─────────────────────────────────┐
│  1. AI Interceptor Kernel        │  AiInterceptorKernel.interceptPrompt()
│     Prompt-level gate            │  → blocked | proceed
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  2. Analyzer Layer (12 detectors)│  runAnalyzers(prompt)
│     Prompt Injection / Jailbreak │  → signals[], totalRisk [0–1]
│     Data Exfil / PII / Halluc.  │
│     Role Manip / Tool Hijack    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  3. Guardrail Engine             │  GuardrailEngine.evaluateResponse()
│     Response-level content scan  │  + .evaluatePrompt()
│     (hallucination, safety,      │  → signals[], metrics{}
│      tone, policy_risk)          │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  4. Policy Engine                │  PolicyEngine.loadOrganizationPolicies()
│     DB-backed rule matching      │  + .evaluateSignals()
│     (warn / block / escalate)    │  → violations[], highest_action
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  5. Composite Risk Engine        │  computeCompositeRisk()
│     Weighted multi-signal model  │  → risk_score [0–100], severity, behavior
│     (35% PI, 25% exfil,         │
│      20% jailbreak, 10%+10%)    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  6. Risk Metrics Engine          │  RiskMetricsEngine.calculateRiskScore()
│     Org-level distributed risk   │  → risk_score, breakdown{guardrail,
│     (guardrail+drift+behavior+   │     drift, behavior, cost}
│      cost)                       │  WRITES → governance_risk_metrics
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  7. Governance State Engine      │  GovernanceStateEngine.getGovernanceState()
│     Session stability view       │  → state (SAFE/WATCH/WARNING/CRITICAL)
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  8. Governance Pipeline          │  GovernancePipeline.execute()
│     Decision aggregation         │  → decision (ALLOW/WARN/BLOCK)
│     (BLOCK if PI>0.7 or         │     violations[], signals{}
│      safety>0.8 or policy=block)│
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  9. Evidence Ledger              │  EvidenceLedger.write()
│     Tamper-evident hash chain    │  → event_id, event_hash, signature
│     SHA-256 + HMAC-SHA256        │  WRITES → facttic_governance_events
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 10. Fraud Detection Engine       │  FraudDetectionEngine.evaluate()
│     Session-scope abuse scoring  │  → fraud_score, classification, action
│     (velocity, jailbreak bursts, │  WRITES → api_keys (disable on block)
│      data exfil, high-risk runs) │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 11. Alert Engines (two layers)   │  AlertEngine.evaluate()
│     AlertEngine → facttic_       │  GovernanceAlertEngine.evaluate()
│       incidents                  │  WRITES → facttic_incidents, alerts,
│     GovernanceAlertEngine →      │           governance_alerts
│       governance_alerts          │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 12. Incident Timeline Engine     │  IncidentTimelineEngine.getIncidents()
│     Session grouping + forensics │  → IncidentThread[]
│     severity, escalation pattern,│  reads facttic_governance_events
│     attack vectors               │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 13. Behavior Forensics Engine    │  BehaviorForensicsEngine.analyzeSession()
│     Post-session deep analysis   │  → BehaviorAnalysisResult
│     intent drift, override,      │  WRITES → behavior_forensics_signals
│     confidence, saturation       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 14. Session Reconstruction Engine│  SessionReconstructionEngine.reconstruct()
│     Full attack progression map  │  → SessionThread + SessionAttackAnalysis
│     7 named attack patterns      │  (pattern: SLOW_ESCALATION, DIRECT_ATTACK
│     per-turn phase classification│           JAILBREAK_CHAIN, etc.)
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 15. RCA Graph Engine             │  RcaGraphEngine.analyzeSession()
│     Temporal causal graph        │  → root_cause, causal_chain, confidence
│     model_drift / policy_        │  reads conversation_timeline
│     non_compliance root cause    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 16. Timeline Builder             │  buildTimeline(sessionId)
│     Replay-ready event sequence  │  → { timeline, riskPeaks, policyTriggers }
│     per-row: prompt+decision+    │  reads facttic_governance_events
│     violations+latency events    │
└─────────────────────────────────┘
```

---

## §1 — Engine Catalogue

---

### GovernancePipeline
- **File:** `lib/governancePipeline.ts`
- **Purpose:** Master orchestrator. Has two modes: `execute()` for synchronous prompt/response evaluation, `run()` for the full 10-stage pipeline with auth, residency, idempotency, hash, drift, intercept, billing, replication, telemetry, and async archive.
- **Inputs:**
  - `execute()`: `{ org_id, session_id?, prompt?, response? }`
  - `run()`: `PipelineContext` (orgId, userId, userRole, provider, eventId, payload, regionId, billingUnits)
- **Processing (`execute()`):**
  1. `AiInterceptorKernel.interceptPrompt()` — early exit on `action=blocked`
  2. `runAnalyzers(prompt)` — 12 parallel detectors → signals, totalRisk
  3. `GuardrailEngine.evaluateResponse()` — response content analysis
  4. `PolicyEngine.loadOrganizationPolicies()` + `evaluateSignals()` — rule matching
  5. `GuardrailEngine.evaluatePrompt()` — data exfiltration regex
  6. `AiInterceptorKernel.interceptResponse()` — response gate
  7. `RiskMetricsEngine.calculateRiskScore()` — distributed risk aggregation
  8. `GovernanceStateEngine.getGovernanceState()` — stability check
  9. `computeCompositeRisk()` — final weighted risk score
  10. Decision logic: BLOCK if policy=block OR safety>0.8 OR detection>0.7; WARN if risk>50 OR detection>0.4
- **Processing (`run()`):**
  - Stages: JWT → RESIDENCY → IDEMPOTENCY → HASH → DRIFT_RISK → POLICY → INTERCEPT → RUNTIME_INTERCEPT → BILLING → REPLICATION → TELEMETRY → archiveAsync
  - FREEZE ZONE after HASH stage — no payload mutations allowed
  - P95 rollback monitor — if latency history p95 > 150ms, emits `CANARY_AUTO_ROLLBACK_SIGNAL`
  - Async path (`archiveAsync`): emits anonymized signal to `IntelligenceNetwork` if risk > 20
- **Outputs (`execute()`):** `{ decision, risk_score, violations[], signals{}, behavior }`
- **Outputs (`run()`):** `{ success, hash, latency, integrityHash, latencyBreakdown }`
- **Side Effects:**
  - `run()` → writes to `organizations` (LOCKED) on ISOLATION_BREACH
  - `run()` → records billing event
  - `run()` → triggers sovereign replication
  - `run()` → fires async intelligence signal
- **Dependencies:**
  - `AiInterceptorKernel`, `runAnalyzers`, `GuardrailEngine`, `PolicyEngine`
  - `RiskMetricsEngine`, `GovernanceStateEngine`, `computeCompositeRisk`
  - `GovernanceInterceptor`, `RuntimeInterceptor`
  - `PredictiveDriftEngine`, `ReplicationEngine`, `IntelligenceNetwork`, `Anonymizer`
  - `billingResolver`, `idempotency`, `rbac`
- **DB Tables:** `org_members`, `organizations`, `facttic_governance_events` (via sub-engines)
- **Budget:** 150ms hard ceiling, 120ms pre-degradation threshold

---

### FraudDetectionEngine
- **File:** `lib/security/fraudDetectionEngine.ts`
- **Purpose:** Session-scope abuse detection. Scores fraud based on prompt velocity, jailbreak attempts, data exfiltration patterns, and high-risk event bursts within a 30-second window.
- **Inputs:** `{ session_id, org_id, prompt, risk_score?, violations? }`
- **Processing:**
  1. Fetches all events for `session_id` from `facttic_governance_events`
  2. Scans last 30 seconds for velocity (prompt count)
  3. Counts `prompt_injection` violations across session → jailbreakAttempts
  4. Counts `DATA_EXFILTRATION` violations/signals → dataExfilAttempts
  5. Counts events with `risk_score > 80` → highRiskBursts
  6. Scoring rules:
     - velocity > 10/30s → +30
     - jailbreak > 5 → +40
     - data exfil > 3 → +50
     - high-risk bursts > 3 → +20
  7. Classification: 0–39 normal/allow, 40–69 suspicious/throttle, 70+ malicious/block
- **Outputs:** `{ fraud_score: number, classification: string, action: string }`
- **Side Effects:**
  - On `action='block API key'`: UPDATE `api_keys` SET `status='disabled'` for the org
  - Emits `FRAUD_BLOCK` log warning
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `facttic_governance_events` (read), `api_keys` (write on block)
- **Notes:** ⚠️ Disabling ALL api_keys for the org is a broad org-level action triggered by session-level scoring. No per-key granularity.

---

### EvidenceLedger
- **File:** `lib/evidence/evidenceLedger.ts`
- **Purpose:** Tamper-evident append-only event chain. Every governance execution is cryptographically hashed, linked to the previous block, and signed with HMAC. Provides three failure types for forensic detection: chain insertion/deletion, field-level mutation, hash-level mutation.
- **Inputs (`write`):**
  ```ts
  GovernanceEvent {
    session_id, org_id, event_type?, prompt?,
    model?, decision, risk_score, violations?,
    guardrail_signals?, latency?, model_response?
  }
  ```
- **Processing (`write`):**
  1. Fetch `previous_hash` from latest event in session (or `'GENESIS_HASH'`)
  2. `timestamp = Date.now()` (BIGINT unix-ms)
  3. `SHA-256(session_id + timestamp + prompt + decision + risk_score + violations + previous_hash)` → `event_hash`
  4. `HMAC-SHA256(event_hash, org_secret)` → `signature` (org_secret from `GOVERNANCE_SECRET` env)
  5. INSERT into `facttic_governance_events`
- **Processing (`verifyLedgerIntegrity`):**
  1. For each event in chronological order:
     - Check 1: `previous_hash` must match prior event's `event_hash` (detects INSERTION_OR_DELETION)
     - Check 2: Recompute SHA-256; must match stored `event_hash` (detects FIELD_LEVEL_MUTATION)
     - Check 3: Recompute HMAC; must match stored `signature` (detects HASH_LEVEL_MUTATION)
  2. Returns `LedgerIntegrityResult` with exact broken event ID and tamper type
- **Outputs (`write`):** `{ event_id, session_id, event_hash, previous_hash, signature }`
- **Outputs (`verifyLedgerIntegrity`):** `{ integrity_status, chain_length, verified_events, broken_event_id, tamper_type }`
- **Side Effects:**
  - INSERT into `facttic_governance_events` (append-only)
  - Emits `INTEGRITY_VERIFIED` / `INTEGRITY_CHAIN_BROKEN` / `INTEGRITY_HASH_MISMATCH` logs
- **Dependencies:** `supabaseServer`, `AlertEngine`, `crypto` (createHash, createHmac)
- **DB Tables:** `facttic_governance_events` (read + write)
- **Security:**
  - HMAC secret fallback: `facttic_integrity_fallback_${orgId}` when env vars missing — ⚠️ predictable fallback
  - Hash formula is canonical — field ordering must not change

---

### AlertEngine
- **File:** `lib/alerts/alertEngine.ts`
- **Purpose:** Primary alert and incident creation engine. Evaluates a `GovernanceEvent` and creates an incident record if risk thresholds are breached.
- **Inputs (`evaluate`):** `GovernanceEvent { risk_score, violations[], session_id, org_id }`
- **Inputs (`triggerAlert`):** `AlertSignal { orgId, type, severity?, message, risk_score?, metadata? }`
- **Processing (`evaluate`):**
  1. risk_score ≥ 80 → severity = CRITICAL
  2. risk_score ≥ 60 → severity = HIGH
  3. violations.length > 0 → severity = POLICY
  4. If severity set: INSERT into `facttic_incidents`
- **Processing (`triggerAlert`):**
  1. Classify severity from risk_score (≥0.7=critical, ≥0.3=medium, else low) — note: expects 0–1 scale
  2. INSERT into `alerts` table
  3. On critical: calls `escalateCriticalAlert()` (currently logs only — no real webhook)
- **Outputs:** void (fire-and-forget side effects)
- **Side Effects:**
  - WRITES → `facttic_incidents` (evaluate)
  - WRITES → `alerts` (triggerAlert)
  - Emits `INCIDENT_CREATED` / `GOVERNANCE_ALERT_TRIGGERED` logs
- **Dependencies:** `supabaseServer`, `logger`, `GovernanceEvent` type
- **Notes:** ⚠️ `evaluate()` expects risk_score [0–100] but `classifySeverity()` expects [0–1]. Two incompatible scales in the same class — `triggerAlert()` will misclassify events passed with the 0–100 scale.

---

### GovernanceAlertEngine
- **File:** `lib/governance/alertEngine.ts`
- **Purpose:** Asynchronous non-blocking alert generation for the governance pipeline. Four trigger types: risk score, policy block, predictive drift, cost spike.
- **Inputs (`evaluate`):** `{ org_id, session_id?, risk_score, policy_action?, drift_score?, cost_spike_ratio?, metadata? }`
- **Inputs (`triggerAlert`):** `{ org_id, alert_type, severity, metadata? }`
- **Processing (`evaluate`):**
  - risk_score > 75 → `RISK_SCORE_CRITICAL` (critical)
  - policy_action === 'block' → `POLICY_VIOLATION_BLOCK` (critical)
  - drift_score > 65 → `PREDICTIVE_DRIFT_CRITICAL` (warning)
  - cost_spike_ratio > 3 → `COST_SPIKE_RATIO_EXCEEDED` (critical)
- **Processing (`triggerAlert`):** `setImmediate()` — async, never blocks caller
- **Outputs:** void
- **Side Effects:**
  - WRITES → `governance_alerts` table (async)
  - Emits `GOVERNANCE_ALERT_GENERATED` log
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `governance_alerts`
- **Notes:** All triggers are fire-and-forget via `setImmediate`. Failures are logged but never surface to caller.

---

### GuardrailEngine
- **File:** `lib/governance/guardrailEngine.ts`
- **Purpose:** Response-level content scanner. Checks for hallucination risk, policy risk, tone risk, and safety risk via keyword detection. Also performs prompt-level data exfiltration regex matching.
- **Inputs (`evaluateResponse`):** `{ org_id, response_text, context? }`
- **Inputs (`evaluatePrompt`):** `userPrompt: string`
- **Processing (`evaluateResponse`):**
  - Base metrics: hallucination=0.05, policy=0.02, tone=0.01, safety=0.0
  - `confidential`/`secret` in text → policy +0.40
  - text.length < 10 → tone +0.30
  - `guarantee`/`100%` in text → hallucination +0.60
  - `hack`/`bypass` in text → safety +0.90
  - `context.injectedDeltas` overrides metric values directly
- **Processing (`evaluatePrompt`):**
  - Regex patterns: `training datasets`, `internal datasets`, `system prompt`, `hidden prompt`, `internal logs`, `private logs`, `model training data`
  - Match → returns `PolicyViolation { action: 'BLOCK', actual_score: 90 }`
- **Outputs (`evaluateResponse`):** `{ signals: PolicyEvaluationSignal[], metrics: { hallucination_risk, policy_risk, tone_risk, safety_risk } }`
- **Outputs (`evaluatePrompt`):** `PolicyViolation[]`
- **Side Effects:** Logs `GUARDRAIL_SIGNAL_GENERATED`, `GUARDRAIL_DATA_EXFILTRATION_DETECTED`
- **Dependencies:** `supabaseServer`, `logger`, `PolicyEvaluationSignal`, `PolicyViolation`
- **Notes:** ⚠️ `context.injectedDeltas` allows external callers to override all metric values — injection attack surface.

---

### PolicyEngine
- **File:** `lib/governance/policyEngine.ts`
- **Purpose:** DB-backed governance rule matching. Loads org-specific policies and evaluates signal scores against thresholds.
- **Inputs (`loadOrganizationPolicies`):** `org_id: string`
- **Inputs (`evaluateSignals`):** `(policies: GovernancePolicy[], signals: PolicyEvaluationSignal[])`
- **Processing:**
  1. Load policies from `governance_policies` table for org
  2. For each signal, find matching policies by `rule_type`
  3. If `signal.score >= policy.threshold` → record violation
  4. Track highest-severity action (warn < escalate < block)
- **Outputs:** `{ triggered: boolean, highest_action: PolicyAction | null, violations[] }`
- **Side Effects:** Logs `POLICY_EVALUATION_COMPLETE`, `POLICY_LOAD_FAILED`
- **Dependencies:** `supabaseServer` (creates own client), `logger`
- **DB Tables:** `governance_policies` (read)
- **Rule types:** `hallucination_rate`, `tone_violation`, `pii_exposure`, `instruction_override`, `safety_violation`
- **Notes:** ⚠️ Creates its own Supabase client (not using shared `supabaseServer` singleton) — bypasses service-role key fallback logic inconsistently.

---

### RiskScoringEngine
- **File:** `lib/riskScoringEngine.ts`
- **Purpose:** Deterministic per-turn risk scoring for a single AI interaction. Evaluates hallucination, tone, context drift, and response confidence via keyword analysis.
- **Inputs:** `(_orgId, _interactionId, payload: { metadata?, content? })`
- **Processing:**
  - Factor 1 (weight 0.35): hallucination — numeric from metadata, or boolean flag, or 0
  - Factor 2 (weight 0.25): tone_risk — from metadata, or keyword scan (UNSAFE_TONE_KEYWORDS × 0.2 per hit)
  - Factor 3 (weight 0.20): context_drift — from metadata or boolean
  - Factor 4 (weight 0.20): response_confidence — from metadata, or uncertainty phrase count × 0.15
  - Weighted sum clamped to [0, 1], rounded to 4 decimal places
  - Confidence = 1 - mean_factor_risk
- **Outputs:** `TurnRiskScore { total_risk, factors{}, confidence, timestamp }`
- **Side Effects:** None (pure function)
- **Dependencies:** `riskTypes`
- **Notes:** Pure, deterministic, no DB access. Separate from the composite pipeline risk score.

---

### CompositeRiskEngine
- **File:** `lib/metrics/compositeRiskEngine.ts`
- **Purpose:** Final weighted risk model combining all detection signals into a single [0–100] score with severity and decision recommendation.
- **Inputs:** `{ signals: RiskSignal[], prompt, violations[], decision }`
- **Processing:**
  1. Bucket scoring (max severity × 100 per bucket):
     - `prompt_injection_score`: PROMPT_INJECTION, TOOL_HIJACKING, POLICY_OVERRIDE
     - `data_exfiltration_score`: DATA_EXFILTRATION, SENSITIVE_DATA, SYSTEM_PROMPT_DISCLOSURE
     - `jailbreak_score`: JAILBREAK_ATTEMPTS, SYSTEM_PROMPT_EXTRACTION, ROLE_MANIPULATION
  2. `intent_drift` = avg severity of override-class signals × 100
  3. `override_detect` = 100 if raw prompt contains bypass patterns, else 0
  4. Weighted sum: 35%×PI + 25%×exfil + 20%×jailbreak + 10%×intent_drift + 10%×override_detect
  5. Decision floor: if pipeline decision = BLOCK → risk_score = max(score, 70)
  6. Hard-block signals: any signal severity ≥ 0.80 → force BLOCK recommendation
  7. Saturation = violations > 1 ? min(100, 60 + (n-2)×5) : 0
- **Outputs:** `{ risk_score, severity_level, decision_recommendation, breakdown{}, behavior{} }`
- **Side Effects:** None (pure function)
- **Dependencies:** `RiskSignal` type from governance analyzers
- **Severity tiers:** CRITICAL ≥ 90, HIGH ≥ 70, MEDIUM ≥ 40, LOW < 40

---

### RiskMetricsEngine
- **File:** `lib/intelligence/riskMetricsEngine.ts`
- **Purpose:** Org-level distributed risk aggregation. Synthesizes guardrail intercepts, predictive drift, behavior forensics, and cost anomalies into one weighted organizational risk score.
- **Inputs:** `(orgId: string, sessionId?: string)`
- **Processing:**
  1. Parallel fetch: `PredictiveDriftEngine.computePredictiveDriftRisk()`, `BehaviorForensicsEngine.analyzeSession()`, `CostAnomalyEngine.getAnomalies()`
  2. Guardrail risk: avg risk_score from last 10 `interceptor_events` for org (or single session)
  3. drift_risk = driftSignal.drift_score
  4. behavior_risk = behaviorSignal.intent_drift_score
  5. cost_risk = min(100, anomaly_count × 20)
  6. Weighted: 35%×guardrail + 25%×drift + 25%×behavior + 15%×cost
  7. Persist result to `governance_risk_metrics`
- **Outputs:** `{ risk_score, breakdown{ guardrail_risk, drift_risk, behavior_risk, cost_risk }, timestamp }`
- **Side Effects:** WRITES → `governance_risk_metrics`
- **Dependencies:** `GuardrailEngine`, `PredictiveDriftEngine`, `BehaviorForensicsEngine`, `CostAnomalyEngine`, `supabaseServer`
- **DB Tables:** `interceptor_events` (read), `governance_risk_metrics` (write)

---

### runAnalyzers (Analyzer Orchestrator)
- **File:** `lib/governance/analyzers/runAnalyzers.ts`
- **Purpose:** Parallel orchestrator for all 12 prompt analysis detectors. Pure and stateless.
- **Inputs:** `prompt: string`
- **Processing:** `Promise.all()` across all 12 analyzers simultaneously
- **Outputs:** `{ signals: RiskSignal[], totalRisk: number [0–1] }`
- **Side Effects:** None
- **Dependencies (12 analyzers):**
  1. `promptInjectionAnalyzer`
  2. `hallucinationAnalyzer`
  3. `medicalAdviceAnalyzer`
  4. `legalAdviceAnalyzer`
  5. `sensitiveDataAnalyzer`
  6. `systemPromptExtractionAnalyzer`
  7. `toolHijackingAnalyzer`
  8. `dataExfiltrationAnalyzer`
  9. `jailbreakAnalyzer`
  10. `systemPromptDisclosureAnalyzer`
  11. `policyOverrideAnalyzer`
  12. `roleManipulationAnalyzer`
- **Notes:** totalRisk is sum of individual contributions, clamped at 1.0. Signals are flat-merged from all analyzers.

---

### AIThreatIntelligence
- **File:** `lib/intelligence/aiThreatIntelligence.ts`
- **Purpose:** Structured threat profiling for 6 primary LLM attack classes. Each profile carries detection rules (lexical + regex), indicators of compromise, MITRE ATLAS references, and a runtime `detect(prompt)` function.
- **Threat Profiles:**
  - `PI-001` — Prompt Injection (CRITICAL) — overrides model instructions
  - `JB-001` — Jailbreak (CRITICAL) — bypasses safety training
  - `DE-001` — Data Exfiltration (HIGH) — data theft / PII extraction
  - `SP-001` — System Prompt Extraction (HIGH) — configuration disclosure
  - `RM-001` — Role Manipulation (MEDIUM) — persona hijacking
  - `HA-001` — Hallucination Amplification (MEDIUM) — false claims enforcement
- **Inputs (`AIThreatScanner.scan`):** `prompt: string`
- **Processing:**
  1. Runs all 6 `profile.detect(prompt)` functions
  2. Aggregates fired signals
  3. Computes composite score
- **Outputs:** `ScanResult { detected_threats[], composite_score, profiles_fired }`
- **Side Effects:** None (pure function)
- **Dependencies:** Standalone — no DB, no external services
- **MITRE:** References MITRE ATLAS and ATT&CK for AI framework

---

### BehavioralEngine
- **File:** `lib/intelligence/behavioralEngine.ts`
- **Purpose:** Session-scope behavioral scoring. Two modes: `computeBehaviorSignals()` (synchronous, pipeline-context) and `BehavioralEngine.scoreSession()` (async, reads from DB).
- **Inputs (`computeBehaviorSignals`):** `{ prompt, violations[], risk_score }`
- **Inputs (`scoreSession`):** `sessionId: string`
- **Processing:**
  - **intent_drift**: regex patterns for `ignore previous instructions`, `bypass`, `override`, `disregard rules` → 80 if detected, else 0
  - **saturation**: total violations count > 1 → min(100, 60 + (n-2)×5), else 0
  - **confidence**: peak risk_score across session events = malicious intent estimate
  - **override_detect**: boolean (sync variant only)
- **Outputs:** `BehavioralScores { intent_drift, saturation, confidence }`
- **Side Effects:** None (reads only, no writes)
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `facttic_governance_events` (read)

---

### BehaviorForensicsEngine
- **File:** `lib/forensics/behaviorForensicsEngine.ts`
- **Purpose:** Deep post-session behavioral analysis. Detects instruction override attempts, computes intent drift vs baseline, estimates confidence, measures context saturation.
- **Inputs:** `sessionId: string`
- **Processing:**
  1. `buildTimeline(sessionId)` — fetch chronological events
  2. Fetch `org_id` from first event in `facttic_governance_events`
  3. Fetch `model_behavior` baseline (avg risk_score, last 10 records)
  4. Intent Drift = (currentAvgRisk - baselineAvgRisk) × 2, clamped [0–100]
  5. Instruction Override: regex scan for adversarial patterns across all event content
  6. Confidence: avg risk_score from `facttic_governance_events` turns
  7. Context Saturation: (timeline.length / 50) × 100
  8. Signal aggregation: INTENT_DRIFT_ALERT, PROMPT_OVERRIDE_ALERT, CONFIDENCE_DROP
  9. Augment with `BehavioralEngine.scoreSession()` (ledger-derived scores take max)
  10. Persist result to `behavior_forensics_signals`
- **Outputs:** `BehaviorAnalysisResult { session_id, org_id, intent_drift_score, instruction_override, confidence_score, context_saturation, signals[] }`
- **Side Effects:** WRITES → `behavior_forensics_signals`
- **Dependencies:** `buildTimeline`, `BehavioralEngine`, `supabaseServer`, `logger`
- **DB Tables:** `facttic_governance_events` (read), `model_behavior` (read), `behavior_forensics_signals` (write)

---

### IncidentTimelineEngine
- **File:** `lib/forensics/incidentTimelineEngine.ts`
- **Purpose:** Groups raw governance events by session into structured IncidentThreads with computed severity, escalation pattern, attack vectors, and duration.
- **Inputs (`getIncidents`):** `(orgId, options?: { limit, severity_filter, min_risk_score, decision_filter })`
- **Processing (`buildIncidentTimeline` — pure):**
  1. Normalize rows → `IncidentEvent[]`, sort chronologically
  2. `deriveIncidentId`: `SHA-256(session_id)[0..15]` — stable identifier
  3. `classifySeverity`:
     - CRITICAL: peakRisk ≥ 90, OR ≥ 2 BLOCKs, OR 1 BLOCK + risk ≥ 70
     - HIGH: risk ≥ 70 OR any BLOCK
     - MEDIUM: risk ≥ 40 OR any WARN
     - LOW: else
  4. `detectEscalationPattern`: compare first-half vs second-half avg risk (±10 threshold)
  5. `extractAttackVectors`: unique rule_type values from all violations
- **Outputs:** `IncidentThread { incident_id, session_id, severity, risk_score, first/last_event_time, duration_ms, event_count, escalation_pattern, attack_vectors, peak_event_id, events[] }`
- **Side Effects:** Logs `INCIDENT_TIMELINE_BUILT`, `INCIDENT_TIMELINE_FETCH_FAILED`
- **Dependencies:** `supabaseServer`, `logger`, `crypto`
- **DB Tables:** `facttic_governance_events` (read)
- **Methods:** `getIncidents`, `getIncidentBySession`, `getActiveIncidents` (BLOCK/WARN only), `getSeveritySummary`

---

### SessionReconstructionEngine
- **File:** `lib/forensics/sessionReconstructionEngine.ts`
- **Purpose:** Full conversation thread reconstruction + attack progression analysis. Classifies each turn into 5 phases and detects 7 named attack patterns.
- **Inputs:** `sessionId: string, orgId?: string`
- **Processing (`reconstructThread` — pure):**
  1. Sort events chronologically, normalize violations
  2. Map each row → `SessionTurn` (turn_index, prompt, model_response, risk_evaluation, violations, final_decision, event_hash)
  3. Compute SessionThread metadata (peak_risk, has_blocks, duration)
- **Processing (`analyzeAttackProgression` — pure):**
  - Per-turn `classifyPhase()` (priority: EXFILTRATION > INJECTION > PROBING > ESCALATION > BENIGN)
  - Build compressed progression vector (consecutive deduplication)
  - `detectPattern()` → 7 named patterns with confidence scores:
    - SLOW_ESCALATION (0.93) — full BENIGN→PROBING→INJECTION→EXFILTRATION chain
    - JAILBREAK_CHAIN (0.88) — ≥2 consecutive high-severity jailbreak turns
    - POLICY_BYPASS_ATTEMPT (0.86) — dominated by POLICY_OVERRIDE + ROLE_MANIPULATION
    - DIRECT_ATTACK (0.87) — first non-BENIGN turn is INJECTION/EXFILTRATION
    - RECONNAISSANCE (0.90) — probing only, no escalation
    - MIXED_VECTOR_ATTACK (0.82) — ≥3 distinct attack categories
    - SINGLE_VIOLATION (0.92) — only one non-benign turn
- **Outputs:** `SessionReconstructionResult { thread: SessionThread, attack_analysis: SessionAttackAnalysis }`
- **Side Effects:** Logs `SESSION_RECONSTRUCTED`, `BATCH_RECONSTRUCTION_COMPLETE`
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `facttic_governance_events` (read)
- **Methods:** `reconstruct`, `reconstructFromEvents`, `batchReconstruct` (parallel)

---

### RcaGraphEngine
- **File:** `lib/forensics/rcaGraphEngine.ts`
- **Purpose:** Root cause analysis via temporal causal graph. Maps significant governance events into a causal chain and identifies the root cause.
- **Inputs:** `sessionId: string`
- **Processing:**
  1. Query `conversation_timeline` for session events (significant only: policy_violation, drift_detected, governance_escalation, OR payload.risk_score > 70)
  2. Build causal chain from event_type values
  3. Root cause determination:
     - `drift_detected` in first 2 events → `model_drift` (confidence 0.92)
     - first event = `policy_violation` → `policy_non_compliance` (confidence 0.88)
     - else → first causal event (confidence 0.85)
  4. Trace = payload.reason or event_type per event
- **Outputs:** `{ root_cause, causal_chain: string[], confidence_score }`
- **Side Effects:** Logs `RCA_GRAPH_ANALYSIS_COMPLETE`, `RCA_GRAPH_ENGINE_FAILURE`
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `conversation_timeline` (read) — ⚠️ different table from most engines (not `facttic_governance_events`)
- **Notes:** RcaEngine v1 (`lib/forensics/rcaEngine.ts`) is a deprecated wrapper that redirects to this engine. Do not use v1 for new code.

---

### RcaEngine (v1 — DEPRECATED)
- **File:** `lib/forensics/rcaEngine.ts`
- **Purpose:** Backward-compatible wrapper. Logs `RCA_ENGINE_V1_DEPRECATED` warning on every call and redirects to `RcaGraphEngine.analyzeSession()`.
- **Status:** 🔴 DEPRECATED — do not reference in new code
- **Redirect:** All calls → `RcaGraphEngine.analyzeSession(sessionId)`

---

### IncidentService
- **File:** `lib/forensics/incidentService.ts`
- **Purpose:** Lighter-weight incident grouping service (v2.0). Reads from `governance_event_ledger` (different table than `IncidentTimelineEngine`). Groups by session and classifies severity.
- **Inputs (`getIncidents`):** `orgId: string`
- **Processing:**
  1. Fetch last 100 events from `governance_event_ledger` for org
  2. Group by session_id
  3. Severity: risk_score > 75 → Critical; > 50 → Warning; else → Normal
  4. Track earliest event as startTime
  5. Sort threads by startTime descending
- **Outputs:** `IncidentThread[] { session_id, severity, events[], startTime }`
- **Side Effects:** None
- **Dependencies:** `supabaseServer`
- **DB Tables:** `governance_event_ledger` (read) — ⚠️ different from IncidentTimelineEngine which reads `facttic_governance_events`
- **Notes:** Dual-table incident architecture — `IncidentService` reads `governance_event_ledger`, `IncidentTimelineEngine` reads `facttic_governance_events`. These are two separate data sources for incidents.

---

### TimelineBuilder
- **File:** `lib/replay/timelineBuilder.ts`
- **Purpose:** Converts raw governance events into a human-readable chronological replay sequence. Each ledger row expands to multiple timeline events (prompt submission, decision, per-violation, system metrics).
- **Inputs:** `sessionId: string`
- **Processing:**
  1. Fetch all events for session from `facttic_governance_events` ordered by timestamp
  2. Per row, emit 4 event types with synthetic +1/+2/+N ms timestamps:
     - `prompt_submitted` — prompt text + model
     - `governance_decision` — decision + risk_score
     - `policy_violation` × N (one per violation) OR `activity: No Violations Detected`
     - `system_metrics` — latency stats
  3. `riskPeaks` = events with risk_score ≥ 70
  4. `policyTriggers` = events of type `policy_violation`
- **Outputs:** `{ timeline: TimelineEvent[], riskPeaks: TimelineEvent[], policyTriggers: TimelineEvent[] }`
- **Side Effects:** Logs `TIMELINE_QUERY_FAILED`, `TIMELINE_BUILD_FAILED`
- **Dependencies:** `supabaseServer`, `logger`
- **DB Tables:** `facttic_governance_events` (read)

---

## §2 — Database Tables Referenced

| Table | Reads | Writes | Engines |
|---|---|---|---|
| `facttic_governance_events` | ✓ (most engines) | ✓ (EvidenceLedger) | EvidenceLedger, BehaviorForensicsEngine, BehavioralEngine, IncidentTimelineEngine, SessionReconstructionEngine, TimelineBuilder, FraudDetectionEngine, GovernancePipeline |
| `governance_event_ledger` | ✓ | — | IncidentService |
| `conversation_timeline` | ✓ | — | RcaGraphEngine |
| `governance_policies` | ✓ | — | PolicyEngine |
| `governance_risk_metrics` | ✓ | ✓ | RiskMetricsEngine |
| `governance_alerts` | — | ✓ | GovernanceAlertEngine |
| `facttic_incidents` | — | ✓ | AlertEngine |
| `alerts` | — | ✓ | AlertEngine |
| `api_keys` | — | ✓ | FraudDetectionEngine (disable) |
| `organizations` | — | ✓ | GovernancePipeline (LOCK on breach) |
| `org_members` | ✓ | — | GovernancePipeline (residency check) |
| `behavior_forensics_signals` | — | ✓ | BehaviorForensicsEngine |
| `model_behavior` | ✓ | — | BehaviorForensicsEngine |
| `interceptor_events` | ✓ | — | RiskMetricsEngine |
| `governance_risk_metrics` | ✓ | ✓ | RiskMetricsEngine |
| `billing_events` | — | ✓ | GovernancePipeline (via billingResolver) |

---

## §3 — Architecture Issues

| Issue | Severity | Engine | Detail |
|---|---|---|---|
| Two separate incident data sources | **HIGH** | IncidentService vs IncidentTimelineEngine | `IncidentService` reads `governance_event_ledger`; `IncidentTimelineEngine` reads `facttic_governance_events`. Two different tables for the same concept. |
| RcaGraphEngine reads wrong table | **HIGH** | RcaGraphEngine | Reads `conversation_timeline` while all other forensics engines read `facttic_governance_events`. May miss events. |
| Risk score scale mismatch in AlertEngine | **HIGH** | AlertEngine | `evaluate()` expects [0–100]; `classifySeverity()` expects [0–1]. `triggerAlert()` callers using [0–100] will always get `critical` classification. |
| FraudDetection org-wide API key disable | **MEDIUM** | FraudDetectionEngine | A single session's fraud score disables ALL `api_keys` for the entire org, not just the offending key. |
| GuardrailEngine injectedDeltas override | **MEDIUM** | GuardrailEngine | `context.injectedDeltas` allows callers to bypass all metric computation. No validation or access control on this path. |
| PolicyEngine creates its own Supabase client | **MEDIUM** | PolicyEngine | Does not use shared `supabaseServer` singleton — creates a separate client with inconsistent fallback (anon key vs service role). |
| HMAC secret fallback is predictable | **MEDIUM** | EvidenceLedger | Fallback to `facttic_integrity_fallback_${orgId}` when env vars are missing — predictable by anyone who knows the org ID. |
| Deprecated RcaEngine v1 still callable | **LOW** | RcaEngine | `lib/forensics/rcaEngine.ts` is still exported and callable. Will produce incorrect results via redirect wrapper. |
| GovernanceStateEngine not read (execute path) | **LOW** | GovernancePipeline | `execute()` calls `GovernanceStateEngine.getGovernanceState()` but the result is only passed to `signals.state_factors` — not used in decision logic. |
| `Math.random()` canary routing in `run()` | **LOW** | GovernancePipeline | 10% of `run()` calls are flagged as canary via `Math.random()` — non-deterministic, not persisted, no rollback mechanism implemented. |

---

## §4 — Engine Dependency Graph

```
GovernancePipeline (execute)
├── AiInterceptorKernel
├── runAnalyzers (12 detectors)
├── GuardrailEngine
│   └── PolicyResolver
├── PolicyEngine → governance_policies
├── CompositeRiskEngine (pure)
├── RiskMetricsEngine
│   ├── PredictiveDriftEngine
│   ├── BehaviorForensicsEngine
│   │   ├── TimelineBuilder → facttic_governance_events
│   │   └── BehavioralEngine → facttic_governance_events
│   └── CostAnomalyEngine
└── GovernanceStateEngine

EvidenceLedger
└── AlertEngine (imported but called from API layer, not ledger itself)

FraudDetectionEngine → facttic_governance_events, api_keys

IncidentTimelineEngine
└── buildIncidentTimeline (pure)

SessionReconstructionEngine
├── reconstructThread (pure)
└── analyzeAttackProgression (pure)

RcaGraphEngine → conversation_timeline
RcaEngine (v1 deprecated) → RcaGraphEngine

GovernanceAlertEngine → governance_alerts
AlertEngine → facttic_incidents, alerts

TimelineBuilder → facttic_governance_events
```

---

## §5 — Pure Functions (no side effects, safe to call anywhere)

| Function | File |
|---|---|
| `computeCompositeRisk()` | `lib/metrics/compositeRiskEngine.ts` |
| `RiskScoringEngine.evaluateTurn()` | `lib/riskScoringEngine.ts` |
| `computeBehaviorSignals()` | `lib/intelligence/behavioralEngine.ts` |
| `runAnalyzers()` | `lib/governance/analyzers/runAnalyzers.ts` |
| `buildIncidentTimeline()` | `lib/forensics/incidentTimelineEngine.ts` |
| `reconstructThread()` | `lib/forensics/sessionReconstructionEngine.ts` |
| `analyzeAttackProgression()` | `lib/forensics/sessionReconstructionEngine.ts` |
| `AIThreatScanner.scan()` | `lib/intelligence/aiThreatIntelligence.ts` |
| `PolicyEngine.evaluateSignals()` | `lib/governance/policyEngine.ts` |
| `GuardrailEngine.evaluatePrompt()` | `lib/governance/guardrailEngine.ts` |

---

*End of Engine Audit — 17 engines catalogued across 11 subdirectories.*
