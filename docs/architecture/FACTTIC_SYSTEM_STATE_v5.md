# FACTTIC SYSTEM STATE v5.0 - Post-Hardening Baseline

This document records the operational state of the Facttic AI Governance Platform following the completion of the Ultra-Aggressive Hardening phase. It captures the architecture baseline used for future audits and system evolution.

---

## 1. Platform Architecture Overview

Facttic is an AI Governance enforcement platform designed to intercept and evaluate AI interactions in real-time. The architecture is divided into three core layers:

1.  **Fast-Path Evaluation Layer**: Synchronous, sub-10ms risk assessment.
2.  **Asynchronous Persistence Layer**: Decoupled, queue-driven background processing.
3.  **Forensic Ledger & Compliance Layer**: Tamper-evident, hash-chained legal record.

---

## 2. Fast-Path Governance Engine

The synchronous evaluation layer executes inside the Node.js API runtime.

**Responsibilities:**
- Policy evaluation
- Guardrail enforcement
- Risk scoring
- Decision output (ALLOW / BLOCK)

**Modules:**
- `PolicyEvaluator`
- `GuardrailDetector`
- `RiskScorer`

**Performance Target:**
- Sub-10ms decision latency.
- **Note:** No database writes occur in the fast-path.

---

## 3. Voice Streaming Architecture

Voice ingestion operates through two pathways:

1.  **Legacy HTTP ingestion**: `/api/voice/stream`
2.  **Realtime WebSocket ingestion**: `/api/voice/socket`

Voice events are normalized into the `VoiceStreamEvent` model.

**Voice signals include:**
- `latency_ms`
- `packet_loss`
- `interruptions`
- `audio_integrity_score`

**Realtime analyzers:**
- `bargeInAnalyzer`
- `overTalkAnalyzer`
- `voiceLatencyAnalyzer`

These signals augment the governance decision engine.

---

## 4. Asynchronous Governance Queue

Facttic decouples decision latency from persistence using BullMQ.

**Components:**
- `GovernanceQueue`
- Redis message bus
- `governanceWorker` background processors

**Flow:**
- Fast-path evaluation → Queue enqueue → Worker persistence

**Worker responsibilities:**
- PII redaction
- Hash chain computation
- Ledger persistence
- Audit logging

---

## 5. Forensic Ledger

All governance decisions are permanently recorded in: `facttic_governance_events`.

**Security properties:**
- SHA-256 hash chain
- HMAC signature verification
- Advisory lock serialization
- Queue idempotency protection

**Each event includes:**
- `previous_hash`
- `event_hash`
- `signature`
- `queue_job_id`

This ensures the ledger is tamper-evident.

---

## 6. Dead Letter Queue Recovery

Failed persistence attempts are captured in: `governance_failed_jobs`.

**Worker behavior:**
- Retry attempts: 5
- Backoff strategy: exponential
- After retry exhaustion, the job moves to the DLQ.

**Recovery endpoint:**
- `/api/admin/replay-failed-governance`
- Replay preserves original payload signatures.

---

## 7. Security Hardening

Recent resilience upgrades include:
- **Voice stream buffer limits**: Protection against OOM attacks.
- **Queue depth backpressure protection**: Prevents Redis exhaustion (50k limit).
- **Redis adaptive throttling**: Latency-based concurrency reduction (>250ms).
- **Queue payload HMAC signing**: Prevents DLQ/Queue tampering.
- **Prompt size enforcement (16KB)**: Protects against CPU amplification attacks.

---

## 8. Observability

Operational telemetry surfaces through:
- **Governance Dashboard**: Live metrics and incident tracking.
- **DLQ monitoring**: Triage of failed persistence events.
- **Queue depth monitoring**: Redis health visibility.
- **Audit logs**: Administrative and security traceability.

**Key tables:**
- `audit_logs`
- `facttic_governance_events`
- `incidents`
- `governance_failed_jobs`

---

## 9. System Classification

**Architecture maturity**: Enterprise-grade AI governance platform.

**Operational classification**:
- High-scale asynchronous architecture
- Deterministic forensic ledger
- Zero-Trust access model

---
**END DOCUMENT**
