# Governance Maturity Engine

## Overview
The **Governance Maturity Engine** provides a quantitative assessment of an organization's AI governance posture. It aggregates signals from across the Facttic platform to compute an authoritative "Maturity Index" (0-100), enabling executive benchmarking and strategic growth planning.

## The Maturity Model

The engine evaluates three core pillars, each representing a dimension of institutional trust:

### 1. Policy Coverage (30% Weight)
Measures the breadth of protective boundaries defined within the system.
- **Metric**: Ratio of active agents/sessions to defined `governance_policies`.
- **Target**: High coverage indicates proactive risk mitigation.

### 2. Risk Stability (40% Weight)
Analyzes the variance and volatility of institutional risk scores over a 30-day window.
- **Metric**: Inverse variance of `total_risk` signals.
- **Target**: High stability indicates a deterministic and well-managed AI environment.

### 3. Incident Response (30% Weight)
Evaluates the organization's ability to identify and resolve governance alerts.
- **Metric**: Resolution rate of `drift_alerts` and investigation completion.
- **Target**: High resolution speed indicates operational maturity in handling AI anomalies.

## Maturity Levels

- **0-30: Laggard**: Ad-hoc governance with minimal policy coverage.
- **31-60: Managed**: Basic monitoring and alert resolution in place.
- **61-85: Institutional Leader**: Comprehensive policies and high risk stability.
- **86-100: Facttic Elite**: Fully optimized, deterministic governance with perfect response records.

## API Usage
**Path**: `GET /api/governance/maturity?orgId=[UUID]`
Returns the current maturity score components and historical progression data.

## Dashboard
**Location**: `/dashboard/governance-maturity`
Provides executive-level visualization including radar charts, progression timelines, and strategic growth recommendations.
