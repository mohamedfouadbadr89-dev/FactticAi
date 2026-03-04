# Facttic Information Privacy & Data Handling Policy
**Last Updated: March 2026**
**Version: 1.0**

## 1. Scope and Consent
This policy governs how Facttic processes text and voice conversational telemetry across the platform.
- **Explicit Consent**: Webhook integrations (e.g., via Vapi, Retell, ElevenLabs) are contractually mandated to secure End-User recording consent *prior* to transmitting payloads to Facttic. Facttic processes data strictly under the instruction of the Tenant (Data Controller).

## 2. Voice Data Retention
Voice recordings and raw transcripts contain highly sensitive biometric and semantic data.
- **Default Retention**: E2E processed voice objects are permanently expunged 30 days post-ingestion unless explicitly mapped beneath prolonged Enterprise Retention SLAs.
- **Zero-Knowledge Encryption**: Voice payloads are fully encrypted at rest utilizing AES-256. Tenants wielding Bring-Your-Own-Key (BYOK) authorizations retain sole cryptographic decoding privileges. Facttic cannot natively read these strings without key provision.

## 3. GDPR Operations: Right To Erasure (RTE)
Facttic complies fully with EU GDPR mandates enforcing swift User Erasure requests.
- **Process**: Tenants invoke the dedicated `DELETE /api/settings/tenant/gdpr_expunge` route providing targeted User identifiers (hashed or explicit). Facttic guarantees asynchronous, unrecoverable deletion cascade spanning Risk Scores, Conversations, and Audio streams within 48 hours of API acknowledgement.

## 4. SOC2 Assurance
- **Access Logs**: All Facttic engineer environment access relies on ephemeral SSO credentials actively tracked against Okta audit trails.
- **Data Fencing**: Infrastructure dynamically segregates multi-tenant boundaries natively utilizing Row-Level Security parameters.
