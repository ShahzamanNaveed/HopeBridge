# applications

Purpose: Volunteer applications and HR decisions.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: branches, authorization, audit.

Planned APIs (proposed, no routes implemented): Application submission and HR review. Final paths and schemas await design approval.

Planned data relationships (not a finalized ERD): Applicants, branches, reviewers and resulting members.

Official Requirements: Volunteer application and HR review/member workflows.

Confirmed HWF Decisions: Visitors apply on public Get Involved without accounts. Submission creates no member; HR Lead accepts or declines centrally at Head Office. Acceptance creates exactly one member in the same transaction. Validate frontend/backend inputs; enforce server-side rate limiting and duplicate checks. Different emails do not prove distinct identities; similar personal details may be flagged for HR review rather than automatically rejected. No required public CNIC; use no real personal data in samples/tests. Application references differ from Member IDs.

Current status: planned; no business implementation, tests or deployment. Placeholder directories establish ownership only.

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: Eligibility, required fields, detailed duplicate matching, reference format, decline/reapplication and consent/privacy. OTP, CAPTCHA/Turnstile and exact rate limits are proposed or pending. See [clarifications](../../docs/requirements/clarifications.md).
