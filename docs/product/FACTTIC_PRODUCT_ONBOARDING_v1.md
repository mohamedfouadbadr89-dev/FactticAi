# Facttic QuickStart Onboarding

The QuickStart onboarding flow is designed to ensure new organizations represent a "secure by default" state before they begin processing live AI traffic.

## Trigger Logic

The onboarding wizard automatically triggers when the following conditions are met for an organization:
- **ai_connections**: 0 (No LLM providers connected)
- **governance_policies**: 0 (No active risk management rules)
- **governance_event_ledger**: 0 (No previous traffic intercepted)

This check is performed in real-time within the [useOnboardingState](file:///Users/macbookpro/Desktop/FactticAI/hooks/useOnboardingState.ts) hook.

## Onboarding Steps

### 1. Connect AI System
Directs the user to the [AI Connection Wizard](file:///dashboard/connect). This step is critical as it establishes the provider credentials and gateway endpoints.

### 2. Create First Governance Policy
Encourages the creation of a simple rule (e.g., "Block PII"). This ensures that governance is active rather than just passive monitoring.

### 3. Run Test Prompt
Opens the [Governance Playground](file:///dashboard/playground) with a sample prompt to verify that the end-to-end stack (Interceptor → Engine → Kernel) is operational.

### 4. View Governance Dashboard
Redirects to the main dashboard where users can monitor live telemetry and risk signals.

## Customization

The onboarding flow is non-blocking and can be dismissed at any time. However, it will persist on the main dashboard until at least one of the trigger conditions is no longer met.

> [!TIP]
> Use the **Demo Provisions** API to automatically populate these data points for trial users.
