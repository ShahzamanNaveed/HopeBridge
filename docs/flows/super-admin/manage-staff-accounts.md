# Activity: Manage Staff Accounts

**Actor:** Super Admin
**Status:** Partially Confirmed

## Purpose

Manage authorized HWF staff accounts. SA-001 through SA-004 and SA-007/SA-008 below are DECIDED; workflows remain unimplemented. See [role responsibilities](../../permissions.md) and [security design](../../security.md); other detailed action grants remain PENDING.

## Preconditions

- Super Admin is authenticated and authorized by the backend for the selected action.
- Required fields, uniqueness checks and the controlled temporary-password delivery method must be approved before creation is enabled.
- Deactivating or removing an assigned Branch Lead requires an eligible active replacement; unresolved account-protection rules are not implicit approval.

## Main Flow

1. Super Admin logs in, opens Staff Management and views permitted accounts.
2. For creation, Super Admin enters required information and selects exactly one role: Super Admin, Finance Reviewer, Content Editor, Branch Lead or HR Lead.
3. System validates authorization, fields, uniqueness and single-role constraints. It securely generates a temporary password and hash, and sets expiration exactly 24 hours after issuance plus mandatory first-login password-change controls.
4. In one database transaction, system saves only the password hash, the account controls and a credential-free audit entry. After commit, temporary-password disclosure is allowed only through the approved controlled one-time provisioning mechanism; external delivery is not part of the database transaction.
5. At a later first login, staff enters temporary credentials; backend validates credentials and expiration. At or after issuance plus 24 hours, reject authentication and require a new temporary credential through an authorized reset process. Before expiry, valid credentials require password change; only after a successful change may normal authorized operations proceed. First-login change is not completed during account creation.
6. As separate actions, Super Admin may view, update, activate or deactivate accounts subject to approved permissions. Role changes require Super Admin authorization and auditing and must retain exactly one official role. For a Super Admin target, determine whether the change removes active Super Admin authority; if so, reject unless another active Super Admin remains, including self-directed changes.
7. Before deactivating an assigned Branch Lead or changing their role in a way that removes their assignment, Super Admin selects an eligible active replacement using [Assign Branch Lead](assign-branch-lead.md). System validates the candidate and current assignment, rejecting a candidate assigned to another branch.
8. In one transaction, system revalidates current conditions, including last-active-Super-Admin protection safely under concurrent requests, applies replacement and related account/role changes, revokes old branch access and writes audit entries. Other valid mutations likewise commit account changes and audit together. Confirm success only after commit.

## Alternative / Error Flows

- Invalid login, insufficient permission, invalid input, uniqueness conflict or multiple/invalid roles: deny or reject without changes.
- Missing/inactive/ineligible replacement or candidate assigned elsewhere: block assigned-lead deactivation/removal and retain existing assignments and access.
- Concurrent assignment conflict or account/audit write failure: roll back all related changes; existing lead, account state and access remain intact.
- Expired temporary password: reject authentication and require an authorized reset to obtain a new temporary credential. Secure delivery, reset authorization workflow and delivery-failure handling remain PENDING; do not falsely report success.
- Deactivation/demotion that would remove the last active Super Admin: reject, including self-directed or concurrent attempts; leave account and permissions unchanged.
- Deactivated accounts cannot authenticate. General handling of existing sessions remains PENDING; replacement must revoke old branch access regardless of session/cache state.

## Business Rules

- **SA-001 - DECIDED: Temporary Password Provisioning.** System-generated temporary passwords, secure hash storage only, mandatory first-login password change and expiration. Never include passwords in logs or audit records; API disclosure is restricted to a controlled one-time provisioning mechanism. Exact secure delivery method is **PENDING**; SA-007 fixes expiration at 24 hours.
- **SA-002 - DECIDED: Single System Role.** Each staff account has exactly one of the five roles; simultaneous roles are unsupported. Role changes require Super Admin authorization and audit logging and cannot leave invalid Branch Lead assignments.
- **SA-003 - DECIDED: Single Branch Assignment.** One branch per Branch Lead at a time; at most one assigned active lead per branch. Database constraints and transactional validation prevent conflicts. Backend checks branch-level access on every protected request.
- **SA-004 - DECIDED: Mandatory Replacement Before Deactivation.** An assigned lead cannot be deactivated or removed without a valid active replacement. Replacement, related account/assignment changes, access revocation and audit logging are atomic. Historical members, collections, reports and audit records remain unchanged. Failure preserves the existing lead and access assignments.
- **SA-007 - DECIDED: Temporary Password Expiration.** Expires exactly 24 hours after issuance. Backend rejects expired credentials; valid credentials before expiry still require first-login password change before normal protected operations. Store only a secure hash; never store/log plaintext or expose it in audit. Expiry before use requires a new temporary credential through an authorized reset process. Secure delivery and reset authorization workflow remain **PENDING**.
- **SA-008 - DECIDED: Last Active Super Admin Protection.** Always retain at least one active Super Admin. The last active Super Admin cannot be deactivated or changed to another role, even by themselves. Enforce the remaining-admin check safely under concurrent requests in the same atomic mutation/audit operation; two administrators cannot concurrently remove each other's authority and leave zero. Rejection preserves account, permissions and audit history.
- No public staff self-registration or staff self-selection of privileged roles. Members are records, not an additional login role; existing audit history survives account changes.
- **PENDING:** Self-deactivation restrictions beyond SA-008, exact account fields/uniqueness, secure delivery and reset/recovery authorization workflow, general existing-session deactivation policy and other detailed permissions. These do not reopen decided policies.

## Postconditions

- Successful creation stores a secure hash, expiration at issuance plus 24 hours and first-login change requirement; no credential appears in audit/logs or ordinary responses.
- Valid mutations and audits commit together. Successful replacement removes old branch access without changing historical business records.
- At least one active Super Admin remains after every successful mutation, including concurrent changes.
- Reads do not change accounts; rejected or rolled-back changes preserve prior account/assignment/access state.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B["Super Admin opens Staff Management"]
    B --> C{"Backend: authenticated and action authorized?"}
    C -->|No| X["System: deny or show safe error"]
    C -->|Yes| D{"Super Admin selects action"}
    D -->|View| V["System: display permitted accounts"]
    D -->|Create| E["Super Admin enters staff information and exactly one role"]
    E --> F{"Backend: fields, role and uniqueness valid?"}
    F -->|No| X
    F -->|Yes| G["System: securely generate temporary password; hash; set issuance plus 24-hour expiry and first-login change flag"]
    D -->|Update or status| H["Super Admin requests account change"]
    H --> I{"Backend: input, single role and action valid?"}
    I -->|No| X
    I -->|Yes| AA{"Target is Super Admin?"}
    AA -->|No| J
    AA -->|Yes| AB{"Removes active Super Admin authority?"}
    AB -->|No| J
    AB -->|Yes| AC{"Another active Super Admin remains?"}
    AC -->|No| X
    AC -->|Yes| J{"Deactivate or remove assigned Branch Lead?"}
    J -->|Yes| K["Super Admin selects eligible active replacement"]
    K --> L{"Backend: current assignment valid and replacement not assigned elsewhere?"}
    L -->|No| X
    L -->|Yes| M["Prepare replacement and old branch-access revocation"]
    J -->|No| N["Prepare valid account change"]
    G --> T["DB transaction: concurrency-safe rechecks including last admin; save hash, expiry and controls or account/replacement/access changes; write credential-free audit"]
    M --> T
    N --> T
    T --> Q{"Transaction committed?"}
    Q -->|No| R["System: rollback; preserve accounts, permissions and assignments"]
    Q -->|Yes| S{"Created account?"}
    S -->|Yes| U["System: complete approved secure one-time credential handover"]
    S -->|No| W["System: confirm change; revoke old branch access if replaced"]
    X --> Z([End])
    V --> Z
    R --> Z
    U --> Z
    W --> Z
```

## Acceptance Criteria

- Unauthorized requests and invalid/multiple roles are rejected; each saved account has exactly one official role.
- Creation stores only a secure password hash and expiration exactly 24 hours after issuance. Correct temporary credentials before expiry reach mandatory password change; at/after expiry authentication is rejected and authorized reset is required. Normal protected operations remain blocked until password change succeeds.
- Passwords never appear in logs, audit records or ordinary API responses; only approved one-time provisioning may disclose them.
- Role changes require Super Admin authorization, audit and valid resulting branch assignments.
- Assigned-lead deactivation/removal without an eligible active replacement is blocked, including replacement candidates assigned elsewhere.
- Replacement, account/assignment changes, old-access revocation and audit commit together; failed validation/transactions preserve the existing lead and access.
- Last active Super Admin deactivation/demotion fails, including self-directed attempts. Concurrent administrator operations cannot leave zero active Super Admins; rejection preserves permissions and account state.
- Historical records remain unchanged. These are future verification targets, not executed tests; delivery/reset workflow and other PENDING policies still need approval.
