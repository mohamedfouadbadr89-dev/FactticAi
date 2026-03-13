# Cost Anomaly Detection Engine

## Overview
The **Cost Anomaly Detection Engine** provides real-time monitoring of token consumption patterns across all deployed AI models. It identifies cost-inefficient spikes that deviate significantly from historical baselines, allowing for proactive governance interventions.

## Detection Logic

### 1. Rolling Baseline Calculation
The engine computes a **7-day rolling average** of token usage (`baseline_tokens`) per model per organization.
- **Window**: Current Timestamp - 7 Days.
- **Granularity**: Aggregated per unique `model_name` as recorded in the `cost_metrics` registry.

### 2. Spike Detection Threshold
An anomaly is triggered when the current observed usage exceeds the baseline by a predefined multiplier.
- **Threshold**: `observed_tokens > (baseline_tokens * 2.5)`
- **Sensitivity**: 250% deviation.

## Cost Impact Estimation
While anomalies are detected via token volume, the estimated financial impact is calculated using standard model pricing vectors (nominal $0.015 per 1k tokens proxy for visualization).
- **Formula**: `(observed_tokens * price_per_token)`

## Database Schema: `cost_anomalies`
| Column | Type | Description |
| --- | --- | --- |
| `org_id` | UUID | Institutional owner of the metrics |
| `model_name` | TEXT | Identifier of the AI node (e.g., gpt-4, claude-3) |
| `token_spike_ratio` | FLOAT | `observed / baseline` |
| `baseline_tokens` | FLOAT | Average consumption over the last 7 days |
| `observed_tokens` | FLOAT | Current consumption peak |
| `resolved` | BOOLEAN | Administrative flag for investigation closure |

## UI Visualization
The `CostAnomalyCard` provides a high-fidelity visual alert system:
- **Gradient Alert State**: Red/Amber color-coding for identified spikes.
- **Comparative Metrics**: Side-by-side view of baseline vs. observed peak.
- **Real-time Scans**: Triggered during administrative session initialization to ensure up-to-date intelligence.

## Governance Integration
Detected anomalies should be used to:
1. **Trigger Investigation**: Link to `incident_responses` for automated investigation triggers.
2. **Quota Enforcement**: Inform `economics` layer quotas if a model persists in anomalous behavior.
3. **Model Selection**: Influence agent configuration to favor more stable, cost-efficient models for specific tasks.
