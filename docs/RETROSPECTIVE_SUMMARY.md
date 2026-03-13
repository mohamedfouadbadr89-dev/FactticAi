# Facttic v1.0 QA Retrospective & Synthesis

**Date:** March 2026
**Participants:** Facttic QA, Engineering, and Security Testing Teams

## 🎯 What went well?
1. **Infrastructure as Code (IaC) Testing**: Mocking Postgres connections dynamically through `k6` enabled us to reliably replicate enterprise ingestion loads without paying for massive cloud staging environments.
2. **Deterministic Risk Logic**: Offloading the risk threshold constraints strictly to RPC arrays enabled Unit Tests to run blazing fast without requiring deep database state mocking.
3. **Automated Vulnerability Tooling**: Embedding `npm audit` and native XSS Regex bounds (`detectXSS`) directly into the pipeline caught critical RCE vectors *before* they merged to the main branch.

## 🚧 Challenges & Inefficiencies
1. **E2E Puppeteer Brittleness**: Depending on local Chromium installations (`chromium-browser`) caused severe pipeline blockages when moving between Mac local development and Linux CI environments.
2. **Test Data Over-Complication**: Early iterations struggled with generating realistic Voice JSON structures from Retell/Vapi, requiring massive static JSON files rather than dynamic Faker.js generation.
3. **Console Noise**: The overuse of `console.error` masked actual test failures early on, making debugging async webhook failures deeply time-consuming.

## 💡 Actionable Improvements & Playbook Updates
1. **Decoupled E2E Frameworks**: Transition from raw Puppeteer to native Cypress or Playwright containerized bindings to guarantee browser parity across all nodes.
2. **Strict Logger Governance**: Ban raw console streams. Introduce ESLint rules rejecting `console.log`/`console.error` outside of the unified `logger.ts` stream.
3. **Pre-Commit Security Hooks**: Implement Husky pre-commit hooks that explicitly run `npm audit` and block commits containing new High/Critical severity CVEs.

## 🎓 Knowledge Gained
- **OWASP Remediation**: Deepened team understanding of Content-Security-Policy limits and strict DOM-injection prevention at a NextJS payload level.
- **Cryptographic Streams**: Mastered the nuances of AES-256 BYOK streams and how to gracefully fail webhooks when decryption contexts vanish mid-stream.

*The insights from this retrospective have been merged directly into the `TESTING_PLAYBOOK_v2.md`.*
