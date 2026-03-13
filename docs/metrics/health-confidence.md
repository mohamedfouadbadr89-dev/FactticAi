# Health Confidence Modifier

The **Health Confidence Modifier** is a statistical integrity layer for the Facttic Executive Dashboard. It solves the "100% success paradox"—where a system appears perfectly healthy simply because there is not enough data to prove otherwise.

## Core Logic

The modification is applied only at the display layer. The underlying `governance_score` remains unchanged for historical and audit accuracy.

The confidence score is determined by the total number of signals (Interactions) processed within the current observation window:

| Signal Volume | Confidence Modifier |
|---------------|---------------------|
| > 1,000       | 1.0 (Full)          |
| > 500         | 0.9                 |
| > 100         | 0.8                 |
| > 50          | 0.7                 |
| ≤ 50          | 0.6                 |

## Implementation Details

- **Utility**: `lib/metrics/healthConfidence.ts`
- **UI Component**: `ExecutiveHealthCard.tsx`
- **Formula**: `Displayed Health = Base Health * Confidence`

## UI Indicators

When a score is adjusted, an information icon appears next to the health score. Hovering over this icon reveals a tooltip detailing the adjustment factor and the signal volume used for the calculation.

> [!IMPORTANT]
> This modifier ensures that enterprise decision-makers are provided with a realistic assessment of governance maturity, emphasizing that safety must be proven with volume, not just absence of failure.
