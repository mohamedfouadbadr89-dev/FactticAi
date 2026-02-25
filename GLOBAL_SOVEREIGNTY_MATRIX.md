# Global Sovereignty Matrix: Facttic v3.9

## 1. Regional Isolation Strategy
Facttic enforces strict data residency and sovereignty through independent regional VPC clusters.

| Region | Primary Sovereignty Law | Isolation Mechanism | Standby Logic |
| :--- | :--- | :--- | :--- |
| **US-East** | CCPA / HIPAA | Dedicated AWS VPC | Read-only standbys in US-West |
| **EU-West** | GDPR | Dedicated Azure VNet | Read-only standbys in EU-Central |
| **APAC** | APPI / PIPL (SGP/JPN) | Dedicated GCP Project | Read-only standbys in APAC-South |

## 2. Identity Resolution
Identity is resolved locally in each region via scoped JWT keys.
- **US**: `iss: auth.facttic.us`
- **EU**: `iss: auth.facttic.eu`
- **APAC**: `iss: auth.facttic.as`

## 3. Data Flow Guarantees
- **Cross-Region Sync**: Only anonymized PRI risk telemetry is synced globally.
- **PII Lockdown**: 100% of PII remains within the regional shard boundary.
- **Audit Logs**: Stored locally in the region of origin, accessible via regional API gateways.

## 4. Compliance Overlays
- **US**: SOC2 + HIPAA BAA support.
- **EU**: GDPR DPA + SCC modules.
- **Global**: ISO 27001 readiness.
