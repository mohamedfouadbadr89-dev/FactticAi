# Facttic Data Residency & Localization SLA
**Version:** 1.0 (Enterprise Tiers Only)

## Overview
Facttic offers robust geographical data isolation to ensure compliance with international directives such as GDPR, CCPA, and HIPAA. Customers utilizing *Facttic Enterprise (Full BYOC)* or specific managed tiers can rigidly bind their Tenant logic and physical persistence layers to specific geographical boundaries.

## Geographic Boundaries (Regions)
Organizations are mapped exclusively to one of the following primary regions during onboarding:
* **US East (`us-east-1`):** N. Virginia (Default)
* **US West (`us-west-2`):** Oregon
* **EU Central (`eu-central-1`):** Frankfurt, Germany
* **AP Southeast (`ap-southeast-2`):** Sydney, Australia

*(Additional AWS mappings can be requested natively by Enterprise Support).*

## Data Segregation Mechanisms
1. **API Routing Edge Isolation**: Ingestion webhooks (`/api/webhooks/*`) identify the target `org_id` and immediately route processing logic to compute clusters (ECS/Fargate) physically residing in the authorized region before transcription payloads touch disk.
2. **Database Engine Tagging**: Master row instances inside the PostgreSQL `organizations` table maintain a strict `data_region` constraint.
3. **Cross-Pollination Prevention**: No cross-regional replication is permitted. Backups and snapshots mapped via RDS Aurora are isolated completely to the native availability zones inside the selected geographic bucket.

## Backup and Disaster Recovery (Regional SLA)
* **Real-time Redundancy (Multi-AZ):** Inside the chosen region, synchronous replication spans 3 isolated Availability Zones ensuring 99.99% localized uptime.
* **Cold Storage Retention:** Encrypted backups are written exclusively to regional S3 buckets adhering to the customer's specified `data_retention_days` override threshold mapped in their Tenant Configuration. Upon expiration, strict deletion markers cascade across the region.

## Breach Notification mapping (GDPR Art. 33)
If a physical cluster bound to `eu-central-1` experiences anomalous edge access (detected by the Facttic risk engine monitoring its own telemetry):
1. Connections are throttled natively via localized Redis circuit breakers.
2. Super Admin alerts are generated detailing the impacted isolation tenant bounds.
3. Enterprise customers are notified within 24 hours of confirmation.

## Support & Access
Facttic engineering teams cannot bypass Data Residency checks. Diagnostic access to telemetry requires explicit approval via the Super Admin portal, and any debugging traffic routes through regional jump-hosts obeying native KMS/BYOK decryption boundaries.
