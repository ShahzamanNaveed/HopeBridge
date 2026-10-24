# Security foundation and planned controls

Implemented: Helmet headers, generated request IDs, bounded JSON parsing, environment validation, database connection/query timeouts, API rate limiting and safe error responses. Logs omit query strings, request bodies and incoming credentials; Pino redaction covers cookie, authorization, set-cookie and common secret fields. Avoid logging personal data in future modules.

Planned before authenticated endpoints: Argon2id password hashes; opaque server-managed sessions persisted in PostgreSQL; Secure, HttpOnly, SameSite cookies in production; session rotation on login/privilege changes, expiry, logout/revocation and login throttling. Do not store bearer tokens in browser local storage. These are architectural requirements, not implemented security features.

CSRF design: validate trusted Origin on state-changing requests and a server-bound synchronizer token; SameSite cookies are defense in depth. Reject unsafe requests before controllers. Final session expiry, cookie name, token delivery and deployment origin are pending. Add adversarial tests before exposing mutations.

Authorization design: deny by default, centralized permission policies, server-derived branch context and scoped repository queries. Test each role and cross-branch access. No public shell route implies permission to business data. Database credentials and session secrets belong in deployment secret storage. TLS terminates at the deployment platform.
