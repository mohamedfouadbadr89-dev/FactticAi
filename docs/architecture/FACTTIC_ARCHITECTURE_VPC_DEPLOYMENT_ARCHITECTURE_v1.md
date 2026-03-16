# FACTTIC VPC DEPLOYMENT ARCHITECTURE v1

## Purpose
This document elaborates on the self-hosted VPC isolation mode introduced to the Facttic core to ensure zero-data-leakage compliance for enterprise deployments.

## Architecture Description
In normal conditions (`cloud`), Facttic sends telemetry data externally to centralized anomaly detection hubs. In `vpc` mode, the `DEPLOYMENT_CONFIG` enforces restricted capabilities. Facttic runs as a completely hermetic container cluster within the customer's AWS VPC / Azure VNet.

## Configuration & Activation
```bash
export FACTTIC_DEPLOYMENT_MODE="vpc"
```

## Isolation Layer Restrictions
When `FACTTIC_DEPLOYMENT_MODE` is `vpc`:
1. **Third-party Telemetry Disabled**: Sinks like external logging providers are cut at the application transport layer.
2. **Public Webhook Blocked**: The webhook emitter limits outgoing POSTs strictly to matching internal subnets (e.g., `10.0.0.0/8`).
3. **Database Proximity**: Facttic expects an internal PostgreSQL deployment bypassing public Internet routing completely.
