# Requirements traceability

Official Requirements source: user-supplied Milestone 0 brief and documentation update dated 2026-10-26. Official handbook/fixtures remain absent; this is not exhaustive handbook extraction. Confirmed HWF Decisions are documented separately in the project overview and domain rules; detailed Pending Decisions remain in docs/requirements/clarifications.md (repository-relative).

| Requirement                                                         | Owner                | Status                               | Verification                                         |
| ------------------------------------------------------------------- | -------------------- | ------------------------------------ | ---------------------------------------------------- |
| Seven public pages                                                  | frontend             | Shell implemented                    | Playwright navigation; content review pending        |
| English/Urdu and RTL                                                | frontend             | Shell implemented                    | Language toggle/browser checks                       |
| Five roles and server permissions                                   | auth/policies        | Planned                              | Approved matrix plus deny/cross-branch tests         |
| Branch registration/lifecycle (Forming, Active, Paused, Closed)     | branches             | Planned                              | Approved lifecycle integration tests                 |
| Volunteer applications/HR/members                                   | applications/members | Planned                              | Approval/relationship tests                          |
| Offline collections; server seven-day edit lock                     | collections          | Planned                              | Exact money/transaction tests                        |
| Auto-draft and audited report lifecycle; immutable approved figures | reports/audit        | Planned                              | draft-submit-return-resubmit-approve-lock acceptance |
| Correct dashboards, monthly trends and unsent collections           | dashboard            | Planned                              | Reconcile official sample data                       |
| CSV/PDF export                                                      | reporting/export     | Planned                              | Scope/grants and export acceptance pending           |
| Four mandatory pass/fail criteria                                   | acceptance           | Required, exact definitions pending  | Obtain official criteria; no acceptance claimed      |
| Content draft/publish                                               | content              | Planned                              | Visibility and authorization tests                   |
| Comprehensive audit                                                 | audit                | Planned                              | Atomic audit and immutable history tests             |
| PostgreSQL and migrations                                           | infrastructure       | Implemented, connectivity pending    | Real integration suite                               |
| Backend coverage >=60%                                              | tests                | Gate configured                      | npm test actual results in 09-testing-status         |
| Docker single origin                                                | deployment           | Configured                           | Runtime image and Compose smoke                      |
| GitHub Actions on main                                              | CI                   | Configured, not remotely run         | Passing workflow on main                             |
| Render deployment                                                   | deployment           | Planned                              | Live health and acceptance checks                    |
| Public MIT repository                                               | repository           | License created, publication pending | Remote visibility/license review                     |
| Technical documentation                                             | docs/context         | Foundation implemented               | Review and keep current                              |
