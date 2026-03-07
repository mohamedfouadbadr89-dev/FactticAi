# Traffic Simulator Runtime Architecture

To ensure security and prevent client-side runtime errors, simulation execution is strictly enforced on the server.

## Architecture Overview

The Traffic Simulator utilizes the `SUPABASE_SERVICE_ROLE_KEY` to persist simulation data and audit logs. Since this key is highly sensitive and unavailable in the browser context, all execution logic has been moved to a secure API edge.

### Component Breakdown

1. **`lib/testing/scenarios.ts`**: Contains static scenario definitions (prompts/responses). This file is safe for both client and server imports.
2. **`lib/testing/simulator.ts`**: Server-only logic that orchestrates the `GovernancePipeline`.
3. **`app/api/simulation/run/route.ts`**: The secure entry point for triggering simulations.

## API Specification

### Execute Simulation
**Endpoint**: `POST /api/simulation/run`

**Payload**:
```json
{
  "scenario": "hallucination",
  "org_id": "UUID",
  "volume": 5
}
```

**Response**:
```json
{
  "success": true,
  "risk_score": 45,
  "policy_hits": 2,
  "guardrail_hits": 1,
  "logs": [...]
}
```

## Security Constraints

- Direct access to `supabaseServer` is prohibited in client-side modules.
- Environment variables prefixed with `NEXT_PUBLIC_` are forbidden for service role keys.
- All simulation persistence must happen through the server-side `TrafficSimulator` class.
