# Claude Review Collaboration Guide
**Status:** DRAFT - For Stakeholder Approval
**Version:** 1.0

This document defines the communication rhythms and refinement protocols between the Development Team and Claude (Reviewer) during the Facttic v1.0 Pre-Launch Review.

## 1. Feedback Clarification Rhythm
To ensure absolute alignment on architectural and security feedback:
- **Direct Dialogue**: If a feedback item provided by Claude is ambiguous or high-impact, the developer will initiate a clarification request focusing on:
  - *Context*: "We interpreted your comment on X to mean Y. Is this correct?"
  - *Examples*: Requesting a snippet or scenario highlighting the concern.
- **Alternative Approaches**: If the team proposes a different implementation than Claude suggests (e.g., due to local environment constraints), we will present a mini-RFC within the feedback loop for validation before coding.

## 2. Incremental Review Cycles
For high-impact or complex changes (P0/P1):
- **Milestone Hand-offs**: Don't wait for a "meg-commit." Break remediation into reviewable PRs/milestones.
- **Walkthroughs**: Utilize `walkthrough.md` updates or recording artifacts to demonstrate the fix logic to Claude incrementally.
- **Early Feedback**: Request "sanity checks" on proposed implementation logic before finalizing the full suite of regression tests.

## 3. Regular Status Updates
Transparency is key to trust during a release lock:
- **Tracking**: All feedback items will be registered in `docs/FEEDBACK_TRACKER.md`.
- **Rhythms**: Provide a summary of "Resolved vs. Pending" items at the end of each development sprint or daily standup cycle.
- **Blocker Escalation**: Clearly flag if a remediation item is blocked on environment stability or third-party API availability (e.g., Supabase/Azure).

## 4. Final Validation & Sign-off
The "Definition of Done" for the review phase:
1. **P0/P1 Resolution**: All High/Critical impact items are marked "Signed-off" by Claude.
2. **Regression Check**: Claude validates that remediation did not introduce new flakiness or logical regressions.
3. **Formal Handover**: A final project wrap-up notification acknowledging the impact of the collaboration on the v1.0 quality.

## 5. Acknowledgement Protocol
We celebrate quality. Every major improvement driven by Claude's feedback will be documented in the Final Post-Mortem as a collaborative success.
