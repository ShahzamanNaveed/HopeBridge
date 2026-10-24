# Requirements traceability

Source: user-supplied Milestone 0 brief. Official handbook absent; this is not a claim of exhaustive handbook extraction.

| Requirement                       | Owner                | Status                               | Verification                                         |
| --------------------------------- | -------------------- | ------------------------------------ | ---------------------------------------------------- |
| Seven public pages                | frontend             | Shell implemented                    | Playwright navigation; content review pending        |
| English/Urdu and RTL              | frontend             | Shell implemented                    | Language toggle/browser checks                       |
| Five roles and server permissions | auth/policies        | Planned                              | Approved matrix plus deny/cross-branch tests         |
| Branch registration/lifecycle     | branches             | Planned                              | Approved lifecycle integration tests                 |
| Volunteer applications/HR/members | applications/members | Planned                              | Approval/relationship tests                          |
| Offline collections               | collections          | Planned                              | Exact money/transaction tests                        |
| Audited report lifecycle          | reports/audit        | Planned                              | draft-submit-return-resubmit-approve-lock acceptance |
| Correct dashboards                | dashboard            | Planned                              | Reconcile official sample data                       |
| Content draft/publish             | content              | Planned                              | Visibility and authorization tests                   |
| Comprehensive audit               | audit                | Planned                              | Atomic audit and immutable history tests             |
| PostgreSQL and migrations         | infrastructure       | Implemented, connectivity pending    | Real integration suite                               |
| Backend coverage >=60%            | tests                | Gate configured                      | npm test actual results in 09-testing-status         |
| Docker single origin              | deployment           | Configured                           | Runtime image and Compose smoke                      |
| GitHub Actions on main            | CI                   | Configured, not remotely run         | Passing workflow on main                             |
| Render deployment                 | deployment           | Planned                              | Live health and acceptance checks                    |
| Public MIT repository             | repository           | License created, publication pending | Remote visibility/license review                     |
| Technical documentation           | docs/context         | Foundation implemented               | Review and keep current                              |
