# Support Team CRM Playbook & Checklists

## 1. Zendesk Routing Configurations
Facttic integrates strictly with the native Zendesk CRM platform mapped via Enterprise SSO.
- **Priority P0**: Any ticket flagged `DATA BREACH` / `SSO LOCKED OUT`. Triggers an aggressive SLA overriding business hours pushing directly into PagerDuty Tier-3.
- **Priority P1**: Failures ingesting voice logs. Check `logger_category: SERVER_ERROR_5XX` prior to responding.
- **Priority P2**: Requesting new Feature/Provider integrations (e.g., Teams integration). Route to Product Management.

## 2. Standardized Responses (Zendesk Macros)

**Macro 1: Missing BYOK Header**
*Topic*: Voice Webhook returning `403 Forbidden`
> "Hello! Our telemetry indicates your payload is being rejected due to a missing cryptographic context. Facttic enforces Bring-Your-Own-Key (BYOK) boundaries strictly. Please ensure your `POST` request includes the `x-byok-key` header with a valid AES-256 base64 encoded string."

**Macro 2: Risk Scoring Taking Longer Than Expected**
*Topic*: Missing Risk Compliance Report
> "Hello! We are currently experiencing higher than usual volume delaying our Deep Risk Engines by approx 30 seconds. Your data is queued and actively processing. No action is required."

## 3. Customer Escalation Checks
1. Has the customer provided their `orgId`?
2. Did the customer verify their payload does not contain strictly banned executable JSON tags (e.g. `<script>`)?
3. Did the customer verify the audio format length does not exceed `50MB` bounds?

## 4. Quick Start Knowledge Base Linkages
Refer customers to the official knowledge base articles linked deeply through the dashboard:
- `/dashboard/help/getting-started-vapi`
- `/dashboard/help/retell-normalization`
- `/dashboard/help/byok-encryption`
