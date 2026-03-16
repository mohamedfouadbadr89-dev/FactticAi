# Governance Story

The **Governance Story** is an explanation layer designed to humanize complex AI governance telemetry. It translates machine-readable signals and risk scores into a natural language narrative.

## Core Objective

Governance in Facttic is complex, involving multiple layers of interception (Gateway, Policy, Guardrail). The Governance Story provides high-level narrative context to institutional decision-makers, allowing them to understand the "Why" behind an interaction outcome without needing to parse the entire ledger.

## Narrative Generation Logic

The story is generated in real-time by the `generateGovernanceStory` engine in `lib/forensics/governanceStory.ts`. It synthesizes signals from across the incident thread:

1.  **Risk Intensity**: Determines the opening tone (Normal, Suspicious, Critical).
2.  **Detection Triggers**: Explains which specific engines (Guardrail Kernel, Policy Engine) intervened.
3.  **Policy Identification**: Lists the specific internal policies that were hit.
4.  **Operational Outcome**: Confirms if the interaction was allowed to proceed or was blocked.
5.  **Escalation Path**: Updates on whether the incident resulted in a persistent alert or forensic marking.

## UI Components

### Explained Forensics Panel
The primary visualization for the Governance Story. It includes:
- **Narrative Box**: The generated text.
- **Triggered Systems**: A visualization of the governance stack showing which layers were active during the session.
- **Intelligence Metadata**: Peak risk scores and the target AI model identifer.

## Integration Path

Governance Stories are computed exclusively at the display layer. They are read-only and do not affect the deterministic outcome of the governance pipeline, ensuring forensic integrity.

> [!TIP]
> Use the Governance Story to quickly triage high-risk incidents during weekly executive reviews.
