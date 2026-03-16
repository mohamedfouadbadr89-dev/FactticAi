FACTTIC SYSTEM STATE v6

Architecture Snapshot — March 2026

This document records the operational state of the Facttic AI Governance Platform following the completion of the Ultra-Aggressive Hardening phase.

It captures the architecture baseline used for future audits and system evolution.

⸻

1. Platform Architecture Overview

Facttic is an AI Governance enforcement platform designed to intercept and evaluate AI interactions in real-time.

The architecture is divided into three core layers:

Fast-Path Evaluation Layer
Asynchronous Persistence Layer
Forensic Ledger & Compliance Layer

⸻

2. Fast-Path Governance Engine

The synchronous evaluation layer executes inside the Node.js API runtime.

Responsibilities:

Policy evaluation
Guardrail enforcement
Risk scoring
Decision output (ALLOW / BLOCK)

Modules:

PolicyEvaluator
GuardrailDetector
RiskScorer

Performance Target:

Sub-10ms decision latency.

No database writes occur in the fast-path.

⸻

3. Voice Streaming Architecture

Voice ingestion operates through two pathways:

Legacy HTTP ingestion
/api/voice/stream

Realtime WebSocket ingestion
/api/voice/socket

Voice events are normalized into the VoiceStreamEvent model.

Voice signals include:

latency_ms
packet_loss
interruptions
audio_integrity_score

Realtime analyzers:

bargeInAnalyzer
overTalkAnalyzer
voiceLatencyAnalyzer

These signals augment the governance decision engine.

⸻

4. Asynchronous Governance Queue

Facttic decouples decision latency from persistence using BullMQ.

Components:

GovernanceQueue
Redis message bus
governanceWorker background processors

Flow:

Fast-path evaluation → Queue enqueue → Worker persistence

Worker responsibilities:

PII redaction
Hash chain computation
Ledger persistence
Audit logging

⸻

5. Forensic Ledger

All governance decisions are permanently recorded in:

facttic_governance_events

Security properties:

SHA-256 hash chain
HMAC signature verification
Advisory lock serialization
Queue idempotency protection

Each event includes:

previous_hash
event_hash
signature
queue_job_id

This ensures the ledger is tamper-evident.

⸻

6. Dead Letter Queue Recovery

Failed persistence attempts are captured in:

governance_failed_jobs

Worker behavior:

Retry attempts: 5
Backoff strategy: exponential

After retry exhaustion the job moves to the DLQ.

Recovery endpoint:

/api/admin/replay-failed-governance

Replay preserves original payload signatures.

⸻

7. Security Hardening

Recent resilience upgrades include:

Voice stream buffer limits
Queue depth backpressure protection
Redis adaptive throttling
Queue payload HMAC signing
Prompt size enforcement (16KB)

These protections mitigate:

OOM attacks
Replay attacks
DLQ tampering
Queue poisoning

⸻

8. Observability

Operational telemetry surfaces through:

Governance Dashboard
DLQ monitoring
Queue depth monitoring
Audit logs

Key tables:

audit_logs
facttic_governance_events
incidents
governance_failed_jobs

⸻

9. System Classification

Architecture maturity:
Enterprise-grade AI governance platform.

Operational classification:

High-scale asynchronous architecture
Deterministic forensic ledger
Zero-Trust access model

⸻

END DOCUMENT
