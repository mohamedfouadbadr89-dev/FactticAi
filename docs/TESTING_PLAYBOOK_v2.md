# Facttic Testing Playbook v2

*Revised March 2026 post v1.0 Launch Retrospective.*

## I. Core Philosophy
Our aim moves from "pre-launch gating" to "continuous governance." A test that fails inconsistently is a test we delete and rewrite. Flakiness masks actual regressions.

## II. Required Tooling Stack (Updated)
- **Unit/Integration**: `Jest` supplemented by `@testing-library/react`.
- **Performance**: `k6` (Preferred over Apache JMeter for Node.js alignment).
- **Security Checkers**: 
  - `npm audit` inside CI/CD.
  - Husky hooks evaluating `detectXSS` native heuristics on webhook imports early in the PR lifecycle.

## III. Test Driven Development (TDD) Mandates
1. **Never mock the Database Connection for Integration flows.** We utilize ephemeral Supabase test clusters injected via DB URLs explicitly.
2. **Never commit raw `console.error` logs.** All outputs must flow through the custom `logger.error` module. Webhook failures must trace cleanly to Datadog identifiers.
3. **Assert RBAC boundaries explicitly.** You cannot test a governance API successfully without creating two distinct JWT profiles (Admin vs Analyst) and verifying the Analyst receives a 403.

## IV. E2E Browser Strategy (Transitioning)
- Avoid hard-coding OS paths for drivers (`/usr/bin/chromium-browser`). 
- Rely on self-contained container images (`cypress/included` or `mcr.microsoft.com/playwright`) natively rendering test pipelines independently from the local development OS.

## V. Daily Incident Triage Rules
- **Severity Critical**: Fails CI build. Fix must halt feature development. (e.g. Broken Authentication, XSS/SQLi vulnerability found).
- **Severity High**: Flaky integration test in `main`. Must be isolated and disabled on the PR, then fixed within 24 hours. (e.g. Memory leak during `k6` soak testing).
- **Severity Low**: Duplicate dependencies causing non-exploitable NPM warnings. Batched into weekly tech-debt sprints.

*Success is an empty console stream.*
