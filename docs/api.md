# HTTP conventions

GET /api/v1 returns a foundation/version descriptor. GET /health queries PostgreSQL; 200 means reachable, 503 means unavailable. Responses are {data: ...}. Errors are {error: {code, message, requestId}}. Every request receives a generated X-Request-ID. Unknown /api routes always return JSON rather than the SPA fallback.

Input: JSON bodies capped at 100 KB. Malformed JSON returns 400, oversized JSON 413, unknown endpoints 404 and throttled API requests 429. Production errors omit internal messages. Pagination uses page >= 1 and pageSize 1..100; domain routes must validate with shared schemas once implemented. Health is a connectivity probe, not proof that migrations or business data are correct.

API throttling currently uses per-process memory and direct client addresses. Before configuring a reverse proxy, specify and test an exact trust-proxy policy; do not blindly trust forwarded headers. Future mutation methods require validated CSRF protection and server-enforced permissions. No authentication endpoint exists yet.
