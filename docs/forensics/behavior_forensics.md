# AI Behavior Forensics Engine

## Overview
The **AI Behavior Forensics Engine** is a high-frequency alignment monitoring system designed to detect non-deterministic deviations in model behavior. It moves beyond simple risk scores to analyze the **intent** and **structure** of AI interactions.

## Forensic Metrics

### 1. Intent Drift Score
Measures the variance between a session's current sentiment/direction and the historical baseline established in `model_behavior`. Significant drift often precedes hallucination clusters or policy violations.

### 2. Instruction Override Detection
A deterministic pattern-matcher that scans interaction timelines for adversarial prompts (e.g., "ignore previous instructions", "reveal system prompt") and extraction attempts.

### 3. Confidence Performance
Aggregates confidence scores from raw telemetry to identify periods of model uncertainty, which are correlated with "hallucination spikes".

### 4. Context Saturation
Tracks the turn-to-limit ratio. As models reach their context window limits, behavioral stability often degrades ("context fragmentation").

## Signal Propagation
The engine emits the following governance signals:
- `INTENT_DRIFT_ALERT`: Triggered when drift exceeds 40% of baseline.
- `PROMPT_OVERRIDE_ALERT`: Immediate trigger upon pattern detection.
- `CONFIDENCE_DROP`: Critical alert if average confidence falls below 60%.

## Database Schema: `behavior_forensics_signals`
Records are persisted for every session analyzed, enabling long-term forensic auditing and root cause identification.

## API Integration
**Path**: `GET /api/forensics/behavior/[sessionId]`
**Return**: `BehaviorAnalysisResult` containing scores and active alerts.
