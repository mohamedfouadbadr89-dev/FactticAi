# RCA Architecture: Linear to Graph-Based Migration

## 1. Overview
Facttic has transitioned from a linear Root Cause Analysis (RCA) model to a temporal-causal graph model (**RCA Graph Engine v2**). This shift enables the platform to analyze multi-dimensional signals across the governance stack, identifying the true causal origin of risks rather than just the first chronological anomaly.

## 2. RCA Graph Engine v2
The Graph Engine represents a major upgrade in forensic intelligence, utilizing:
- **Causal Signal Correlation**: Analyzing the interplay between different governance signals (e.g., how a drift alert relates to a subsequent policy violation).
- **Drift Detection Influence**: Weighting model drift as a high-probability root cause when detected early in the chain.
- **Policy Trigger Propagation**: Mapping how policy violations cascade through agent session turns.
- **Governance Escalation Mapping**: Correlating risk processing delays with institutional escalation logs.

## 3. Deprecated Engine
The legacy module located at `lib/forensics/rcaEngine.ts` is now a **deprecated compatibility wrapper**. 
- It no longer contains primary analysis logic.
- All calls to `RcaEngine.analyzeIncident()` are internally redirected to the `RcaGraphEngine`.
- It is preserved solely for backward compatibility with existing internal consumers.

## 4. Benefits
- **Deterministic Forensic Mapping**: Higher confidence in identifying the definitive source of system risk.
- **Multi-Signal Analysis**: Ability to handle overlapping anomalies (e.g., simultaneous hallucination and prompt injection).
- **Improved Governance Diagnostics**: Providing institutional auditors with a clear, weighted causal chain for every incident.

## 5. Architecture Flow
The governance data flow follows this causal sequence:

1. **AI Interaction**: Raw interaction data generated.
2. **Timeline Builder**: Events are sequenced chronologically in `conversation_timeline`.
3. **RCA Graph Engine**: Temporal-causal inference extracts the probable root cause.
4. **Root Cause Analysis**: Structured report generated for the dashboard.
5. **Governance Decision**: Enforcement actions (block, warn, escalate) are validated against forensics.

## 6. Migration Note
> [!IMPORTANT]
> All new implementations and system integrations must use the **RcaGraphEngine** directly.
> 
> **Target Method**: `RcaGraphEngine.analyzeSession(sessionId: string)`
> 
> **Action**: Developers should never call the legacy `RcaEngine` directly in new modules.
