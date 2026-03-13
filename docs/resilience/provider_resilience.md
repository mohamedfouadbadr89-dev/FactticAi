# Provider Resilience Engine

## Overview
The **Provider Resilience Engine** provides a high-availability layer for Facttic.ai by monitoring the stability of integrated AI providers (OpenAI, Anthropic, Google). It enables deterministic failover to ensure institutional AI services remain uninterrupted during provider outages.

## Health Metrics

### 1. Latency Surveillance
Tracks the response time of LLM providers.
- **Threshold**: Latencies exceeding 500ms trigger a "Degraded" status.

### 2. Error Rate Detection
Monitors the frequency of HTTP 5xx errors or API timeouts.
- **Threshold**: Error rates > 5% trigger "Degraded", > 20% trigger "Down".

## Failover Strategy

The engine implements a **Dynamic Fallback Recommendation** system:
1. **Monitor**: Continuous sampling of provider performance.
2. **Score**: Providers are assigned a `health_score` (0-100).
3. **Route**: If a primary provider enters a "Degraded" or "Down" state, the engine recommends routing traffic to the healthy provider with the highest score.

## API Usage
**Path**: `GET /api/resilience/provider-health`
Returns the current state and metrics for all monitored providers.

## Persistence
Health snapshots are recorded in the `provider_health` table for auditing and historical reliability analysis.
