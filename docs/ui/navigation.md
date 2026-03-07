# Facttic Navigation Hierarchy

This document outlines the refactored navigation structure for the Facttic dashboard, designed to align with the product workflow.

## Navigation Hierarchy

### OVERVIEW
* **Dashboard** (`/dashboard`): High-level system metrics and status.
* **Executive Overview** (`/dashboard/home`): Executive-level business and risk summary.

### SETUP
* **Connect AI** (`/dashboard/gateway`): Integration and connectivity hub.
* **Policies** (`/dashboard/governance`): Direct governance policy management.
* **Guardrails** (`/dashboard/intelligence`): Advanced intelligence and guardrail settings.

### MONITORING
* **Live Monitor** (`/dashboard/observability`): Real-time observability and event streaming.
* **Drift Intelligence** (`/dashboard/compliance`): Compliance and model drift tracking.
* **Alerts** (`/dashboard/alerts`): Critical system and governance alerts.

### FORENSICS
* **Investigations** (`/dashboard/investigations`): Deep dive into specific incidents.
* **Session Replay** (`/dashboard/replay`): Visual replay of AI interactions.
* **RCA Analysis** (`/dashboard/forensics`): Deterministic root cause analysis.

### TESTING
* **Simulation Lab** (`/dashboard/simulation`): Adversarial simulation sandbox.
* **Stress Testing** (`/dashboard/testing`): Load and performance stress testing.

### INTEGRATIONS
* **AI Providers** (`/dashboard/agents`): Management of AI agents and providers.
* **Telemetry** (`/dashboard/reports`): System telemetry and operational reports.
* **Webhooks** (`/dashboard/settings/integrations`): Webhook endpoint management.

### SYSTEM
* **Access Control** (`/dashboard/settings/access`): RBAC and organizational security.
* **Settings** (`/dashboard/settings`): Global system configuration.
* **Profile** (`/dashboard/profile`): Personal user settings.

## Product Workflow Logic

The navigation is structured to follow the lifecycle of AI governance:
1. **Setup**: Connect your AI and define your policies.
2. **Monitoring**: Watch live performance and catch drift early.
3. **Forensics**: Investigate failure modes and perform RCA when issues arise.
4. **Testing**: Proactively stress-test your system against new threats.
5. **Integrations**: Expand your ecosystem and export telemetry.
6. **System**: Manage the platform itself.

## Route Mappings

All changes are UI-level only. The following existing routes have been relabeled or regrouped:

| New Label | Existing Route |
|-----------|----------------|
| Executive Overview | `/dashboard/home` |
| Live Monitor | `/dashboard/observability` |
| Drift Intelligence | `/dashboard/compliance` |
| RCA Analysis | `/dashboard/forensics` |
| Telemetry | `/dashboard/reports` |
| Webhooks | `/dashboard/settings/integrations` |
| Access Control | `/dashboard/settings/access` |
