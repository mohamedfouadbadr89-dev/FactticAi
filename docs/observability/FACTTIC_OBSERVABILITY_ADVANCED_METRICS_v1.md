# Advanced Observability Engine

## Overview
The **Advanced Observability Engine** provides deep structural telemetry into the Facttic.ai governance stack. It monitors the performance and integrity of the signal processing pipeline, specifically focusing on how environmental risks (drifts/hallucinations) propagate into institutional risk classifications.

## Key Telemetry Domains

### 1. Risk Score Latency
Measures the end-to-end processing time from signal detection to governance state update. 
- **Criticality**: Low latency ensures that "Blocked" actions are enforced in near real-time, preventing high-risk AI interactions.

### 2. Drift Propagation Analysis
Analyzes the mathematical correlation between raw model drift scores and final organizational risk levels. 
- **Insight**: High correlation indicates a deterministic and responsive governance layer, while low correlation may suggest signal suppression or miscalibration.

### 3. Alert Signature Distribution
Profiles the types of triggers (e.g., policy blocks vs. guardrail events) occurring across the platform.
- **Benefit**: Helps identify whether risks are primarily inherent in the models (drift) or adversarial in nature (policy violations).

## API Extraction
**Path**: `GET /api/observability/advanced-metrics`
Returns high-fidelity telemetry including hourly distribution and propagation coefficients.

## Dashboard
**Location**: `/dashboard/observability`
A data-intensive "War Room" interface for governance engineers to monitor the health of the observability layer itself.
