# Stress Testing Engine

## Overview
The **Stress Testing Engine** evaluates Facttic.ai's stability by simulating high-concurrency environments. It identifies resource bottlenecks and latency degradation patterns before they affect production traffic.

## Methodology

### 1. Concurrent Load Generation
The engine utilizes parallelised asynchronous requests to target system-critical endpoints.
- **Latency Measurement**: Captured using high-resolution millisecond performance hooks.
- **P95 Aggregation**: Results are sorted to isolate the 95th percentile latency, providing a realistic view of performance under stress.

### 2. Failure Thresholds
- **Warning**: P95 Latency > 250ms OR Failure Rate > 2%.
- **Critical**: P95 Latency > 500ms OR Failure Rate > 5%.

## API Usage
**Path**: `POST /api/testing/stress`
**Payload**:
```json
{
  "org_id": "uuid",
  "concurrency": 25,
  "duration_seconds": 10
}
```

## Dashboard
**Location**: `/dashboard/testing`
Features a performance lab interface with diagnostic sliders and a stability timeline visualization.

## Persistence
Every stress run is logged to the `stress_test_runs` table, enabling long-term performance trend analysis and regression detection.
