# Facttic Incident Response & Support Runbook

## 1. Performance Incident Protocols
Targeted to Site Reliability Engineers operating the Prometheus/Grafana stacks mapping Facttic cluster telemetry.

### 1.1 CPU/Pool Exhaustion under High Concurrent Load
**Trigger**: Alert `DB_PGBOUNCER_EXHAUSTION` or `API_LATENCY_P95_OVER_800MS`.
**Escalation Path**: PagerDuty (Tier-1 Operations) -> Standby DevOps Engineer.
**Mitigation Steps**:
1. Check Facttic Grafana `Database Pools` widget. If connections are queued, instantly inject a scaling deployment bumping PgBouncer limits temporarily: `terraform apply -var="max_connections=800"`.
2. Ensure Redis-backed global rate-limits are enforcing HTTP `< 429 >` bounds correctly preventing catastrophic node cascades.

### 1.2 Webhook Ingestion Outage (3rd Party Integrations)
**Trigger**: 15 consecutive `POST /api/webhooks/voice` failures spanning `Retell` or `Vapi`.
**Mitigation Steps**:
1. Inspect Datadog metrics for generic `Internal Server Error (500)`.
2. Re-trigger the BYOK validation scripts. Check if the tenant rotated their cryptographic key abandoning the decryption context.

## 2. Support Operations (Zendesk / CRM SLA)

### 2.1 Escalation Tiers
- **L1 Support (General)**: Dashboard how-tos, basic SAML integration questions (24-Hour SLA).
- **L2 Support (Technical)**: Webhook payload malformations, custom Risk Scoring heuristic failures (8-Hour SLA).
- **L3 Support (Engineering)**: Total data loss/breach protocols, multi-region cluster anomalies (Under 1-Hour PagerDuty SLA).

### 2.2 Standard Operating Canned Responses
**Issue: Okta SSO Syncing Delay**
> "Hello! Thank you for reaching out. We are aware of intermittent 500ms sync propagation delays when creating a net-new Facttic account via Okta. Please refresh your Dashboard after 2 seconds. The tokens should stabilize and populate your RBAC Analyst bindings. If the issue persists, our Engineering team is standing by."
