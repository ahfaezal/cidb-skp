# Readiness update — 3 October 2026

The fixes are on `codex/panel-question-readiness`. Production readiness remains unverified until deployment and live workflow checks finish.

Implemented: required signing secret with no development fallback; unique initial passwords; login and AI throttling; staff restrictions on management APIs; private/project draft access; preserved combination statement identities; bounded uploads and generation; validation of generated questions; recovery in session storage and unsaved-change warnings; optimistic draft version checks; protected reuse of saved S3 notes; separate candidate and panel HTML exports; current question distributions; server session verification and clearer request failures.

Validation passed locally:

- Next.js production build including TypeScript.
- ESLint on all changed frontend files.
- Five isolated backend regression tests covering private/project access, draft round-trip and stale updates, protected management routes, invalid questions/file ownership, incomplete AI results, and signing-secret rotation.
- Normalization checks covering a single answer and all four combination answers, including repeated normalization after JSON reload.
- Python compilation and Git whitespace checks.

Before deploying the backend, configure a random `AUTH_SECRET_KEY` of at least 32 characters in Render. The inspected Render service had no `AUTH_SECRET_KEY` or `SECRET_KEY`; deploying without one will reject authenticated requests with 503. The user must enter and save the new credential through the browser. Existing sessions will require login again after rotation. The existing administrator password still requires replacement by the user.

Still unverified: live AI generation, live save/reload and export with panel accounts, production concurrency, S3 note reuse, database backup and restore. The added draft-export endpoint is not a complete PostgreSQL backup. The replacement free database expires on 1 November 2026 according to the original audit. Automatic cleanup of orphaned S3 notes and full academic approval/version history remain future work. DOCX figures still require PDF input or manual review. AI facts and reference accuracy require panel review.

AI throttling is per process; multiple workers/instances require a shared limiter. No production account, draft, S3 object, or credential was mutated during these regression tests.
