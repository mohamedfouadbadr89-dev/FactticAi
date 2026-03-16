# RCA Intelligence Engine v2

## Overview
The **Root Cause Analysis (RCA) Graph Engine** transitions platform forensics from simple linear timelines to deterministic **causal relationship mapping**. By treating session events as nodes in a directed temporal graph, it identifies the primary driver of risk and its subsequent propagation.

## Causal Inference Model

### 1. Data Ingestion
The engine consumes the `conversation_timeline`, reconstructing the sequence of interactions, evaluations, and autonomous governance actions.

### 2. High-Risk Node Detection
Signals are filtered based on severity markers:
- `policy_violation` (Manual/Deterministic Policy breaches)
- `drift_detected` (Statistical deviations from 7-day model performance)
- `risk_score > 70` (High-risk interaction markers)

### 3. Temporal Relationship Mapping
Events are mapped chronologically, but analysis prioritized early signals. If a `drift_alert` precedes a `policy_violation`, the engine infers that statistical degradation was the root cause of the specific rule breach.

## Output Schema
The engine returns a structured causal graph:
```json
{
  "root_cause": "model_drift",
  "causal_chain": [
    "predictive_drift_alert",
    "hallucination_spike",
    "policy_violation"
  ],
  "confidence_score": 0.92
}
```

## Risk Propagation
The visualization layer tracks how risk flows through the system:
- **Initiator**: The earliest high-confidence anomaly detected.
- **Propagation**: Subsequent events triggered or exacerbated by the initiator.
- **Outcome**: The final governance state or critical incident recorded.

## Governance Integration
The RCA Graph data is used to:
1. **Automate Remediation**: Target the root cause (e.g., model rollback if drift is identified).
2. **Audit Trails**: Provide institutional-grade explanations for forensic investigators.
3. **Engine Optimization**: Fine-tune guardrails to catch initiators before propagation occurs.
