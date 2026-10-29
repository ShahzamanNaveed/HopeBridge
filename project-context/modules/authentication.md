# authentication

Purpose: Identity and server-managed sessions.

Requirements/responsibilities: implement this scope from the supplied brief with backend validation, server-enforced permissions and appropriate branch scoping. Do not infer undocumented rules.

Dependencies: users authoritative staff state/role, branches authoritative current assignment, shared authorization policies and audit; no member login.

Implemented A-02 APIs under `/api/v1/auth`: POST login/logout/first-login-password/change-password/staff/:id/reset-credential and GET me. Local initial Super Admin CLI is implemented. See [exact contracts, security, UI, tests and B handoff](../../docs/authentication.md). General staff provisioning/deactivation UI/endpoints remain the Users milestone.

Database relationships (initial DB-01 physical contract in docs/database.md): Users, credentials and persistent sessions.

Official Requirements: Five authenticated roles; see [permissions](../../docs/permissions.md).

Confirmed HWF Decisions: Super Admin provisions staff accounts through a separate staff portal under [SA-001 to SA-008](../../docs/flows/super-admin/manage-staff-accounts.md), all DECIDED. Each account has exactly one of five official roles. Generate temporary credentials securely, store only a secure hash, expire them exactly 24 hours after issuance and require first-login password change before normal protected work. Never log credentials or expose them outside controlled one-time provisioning. Protect the last active Super Admin against deactivation/demotion, including concurrent changes. Assigned Branch Lead removal/deactivation or incompatible role change requires valid atomic replacement, old-access revocation and audit under SA-004. Public visitors and volunteer applicants need no account; members have no separate login role. No separate Head Office Admin role. Public navigation has no Login/Sign Up buttons. A-02 now implements/tests session and Argon2id authentication; staff lifecycle services remain separate work.

## AUTH-001 to AUTH-006 - DECIDED behavior

- **AUTH-001 - DECIDED:** Super Admin secure-random temporary credentials, hash only, server issuance +24h expiry (reject at/after), mandatory change and restricted temporary-login session permitting minimum password replacement/logout only. One-time authenticated protected creation/reset response after commit; secure opportunity for Super Admin capture, never later retrieval or plaintext logs/audit/analytics/errors/email/URL/history/persistent storage. Lost secret requires fresh authorized reset.
- **AUTH-002 - DECIDED:** Super Admin checks existing target/allowed state, atomically replaces hash/expiry/mandatory-change controls, revokes all target sessions and appends sanitized audit; reveal new secret once after commit. No public/email recovery or inactive/last-admin safeguard bypass.
- **AUTH-003 - DECIDED:** Server-managed PostgreSQL revocable sessions: maximum idle 8h, absolute 24h from issuance; server time, earliest deadline, deny at/after. Authorized requests may refresh idle only within absolute limit; expired/revoked sessions never revive. Login creates new tracked session; logout revokes. Password change securely rotates/invalidates. Revalidate current role/branch/active status per protected request, concurrency-safely.
- **AUTH-004 - DECIDED:** Authorized deactivation immediately revokes all target sessions, blocks login/old requests and preserves identity/audit; status/revocation/audit consistent with last-admin and required lead replacement. Reactivation restores no sessions/expired temporary credential and uses secure authorized credentials.
- **AUTH-005 - DECIDED:** Opaque HttpOnly cookie, Secure production, restrictive topology-appropriate SameSite/path/domain; no localStorage secrets or logged session IDs. CSRF synchronizer token plus trusted Origin for unsafe authenticated requests, secure CORS, backend deny by default, login throttling/generic failures, Argon2id hash verification and noncacheable/nonlogged one-time responses.
- **AUTH-006 - DECIDED:** Lead replacement preserves accountable eligible lead for Active branch, atomic account/assignment/audit prerequisites and immediate old branch-access invalidation via revoked sessions or equally immediate server checks. No stale session grant, automatic new branch or multiple current branches.

See [security](../../docs/security.md) and [staff workflow](../../docs/flows/super-admin/manage-staff-accounts.md). These are policies, not new source implementation.

Integration ownership: established backend/frontend module `auth`. Own staff credentials/login/server sessions and revocation; users owns identity/status/role and branches owns lead assignment. Staff lifecycle coordinators use auth ports and the same transaction for credential/session/audit effects. See [shared integration contracts](../../docs/architecture.md) and [API categories](../../docs/api.md). These are planned interfaces, not implemented services.

Current status (2026-10-29): A-02 authentication services, routes, transactional permission ports and supplied-design EN/UR UI are locally TESTED; 38 unit/foundation tests, 37 PostgreSQL integration tests and five auth browser tests pass. No production deployment or B consumer integration is claimed. Detailed source/command/design evidence and remaining Users/Branches lifecycle work are in [the ledger](../12-development-handoff.md).

Verification plan: approved happy-path and invalid-state tests, forbidden-role and cross-branch tests, database integration and relevant acceptance fixtures.

Pending Decisions: broader Users account fields, production session-store/proxy/origin/shared throttling/monitoring/incident response and operational tuning. A-02 password policy, native Argon2id profile, cookie name/path/SameSite, CSRF delivery and local origin defaults are selected and documented in docs/authentication.md; user approved the 15-code-point policy. AUTH-001 to AUTH-006 core authorities/lifetimes remain DECIDED. General staff/branch mutation safeguards still require their future service implementation.

## Acceptance criteria (A-02 auth subset tested; Users/Branches lifecycle pending)

- Before +24h valid temporary credentials reach restricted password-change/logout only; exactly at/after expiry fail. Ordinary protected endpoints denied until change; one-time secret unavailable on later reads, never leaked to audit/log/email/URL/storage.
- Reset revokes all target active sessions atomically with fresh hash/controls/audit; unauthorized actor/invalid target or failed transaction makes no partial reset. Old credential cannot authenticate afterward.
- Inactive account fails login and already-issued session; reactivation restores no old session or expired temporary secret. Preserve staff identity and history.
- Idle session fails at 8h; absolute fails at 24h despite authorized activity. Unauthorized requests do not refresh; concurrent refresh cannot resurrect revoked/expired session. Logout revokes.
- Missing/invalid CSRF or untrusted Origin fails unsafe authenticated requests. Unauthenticated and forbidden-role/branch direct API calls fail; old Branch Lead session loses former branch immediately on replacement without leaving Active branch leaderless.
- Concurrent last-admin deactivation/demotion cannot leave zero; secrets/session IDs absent from audit and one-time responses protected against caching/logging. See security specification for complete criteria.
