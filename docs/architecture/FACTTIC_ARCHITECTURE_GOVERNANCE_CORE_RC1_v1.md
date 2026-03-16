# FACTTIC Governance Core -- Stable Release Candidate (RC-1)

## Scope Coverage

Phases 1--5: - Core Data Layer - Intelligence Engine - Drift Detection
(Batch) - Escalation Enforcement - Strict Lifecycle Engine

## Data Model (Authoritative Tables)

-   organizations
-   agents
-   sessions
-   session_turns
-   governance_snapshots
-   governance_predictions
-   drift_alerts
-   governance_escalation_log

## Deterministic Constraints

### system_mode

bootstrap → active → enforced

### horizon

24h \| 7d

### severity taxonomy

medium \| high \| critical

### lifecycle_status (Strict State Machine)

active → investigating → resolved → reopened → closed

## Governance Functions

-   compute_executive_metrics()
-   process_governance_escalations()
-   enforce_alert_lifecycle_transition()

## Architectural Guarantees

-   Drift computed via batch aggregation
-   Escalation deterministic & threshold-driven
-   Duplicate prevention via partial unique index
-   Cooldown enforced at DB layer
-   Strict lifecycle enforcement via trigger
-   Resolution metadata mandatory
-   Closed alerts immutable

## Versioning

Governance Core Version: RC-1 Date: 2026-02-25 Status: Stable Release
Candidate
