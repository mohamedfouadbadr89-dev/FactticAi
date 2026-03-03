# Facttic Post-Mortem Retrospective Framework
**Version:** 1.0 - Capability & Process Maturation

This framework must be executed within 14 days following the official launch of the Facttic Production instance, or after any subsequent major `SEV-1` Production Incident.

## 1. Meeting Structure & Goals
**Format:** 2-hour synchronous workshop (Virtual or Offsite).
**Attendees:** Engineering Pods, QA Lead, Product Owner, DevOps Representatives.
**Core Objective:** Create a blameless environment to capture institutional knowledge, celebrating what worked, and systematically deconstructing what failed.

## 2. Agenda & Discussion Topics
The facilitator should guide the discussion sequentially through these phases:

### Phase A: Successes & Strengths (What Went Well)
* Focus on technical elegance, resilient architectures (e.g., *Did the new SSO SAML config process save integration time?*).
* Acknowledge cross-team collaboration wins (e.g., *DevOps handing off Terraform environments seamlessly to QA*).
* Celebrate individuals who went above and beyond.

### Phase B: Friction & Challenges (What Didn't Go Well)
* Investigate friction points objectively without assigning personal blame.
* Did testing matrices (`k6` mocks, Cypress E2E) adequately mirror the true Production load?
* Were there configuration management oversights leading to scrambling late in UAT?
* Identify specific bugs that escaped to Production and explore the gap in the test suite that allowed it.

### Phase C: Lessons Learned & Process Enhancements
* Determine how the current CI/CD or PR Review processes could be hardened.
* Are new testing layers required? (e.g., More aggressive chaos engineering or heavier Faker.js data arrays).

## 3. Deliverables & Action Synthesis
After the Retrospective concludes, the Facilitator must generate the **Post-Mortem Synthesis Report** containing:

1. **Executive Summary:** High-level wins and critical process failures.
2. **Action Item Tracking (Remediation):** Every process enhancement discussed MUST result in a tracked Jira/Linear ticket.
3. **Owner Assignment:** No Action Item can persist without a direct owner and an agreed-upon completion SLA.

## 4. Continuous Operational Evolution
Project success relies entirely on acknowledging lessons learned.
* Incorporate testing enhancements back into `docs/TESTING_STRATEGY.md`.
* Revise `docs/POST_LAUNCH_QA_PLAN.md` with updated SLA definitions if ticketing backlogs prove unsustainable.
