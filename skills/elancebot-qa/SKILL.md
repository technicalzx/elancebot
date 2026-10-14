---
name: elancebot-qa
description: Test Elancebot features end to end, including calculator accuracy, API contracts, saved history, accessibility, responsive UI, and release regressions. Use for Elancebot QA or feature verification.
---

# Elancebot QA

Confirm the Elancebot checkout and the target commit. Read `docs/requirements-traceability.md`, `docs/verification.md`, `docs/release-checklist.md`, and the changed feature's source. Select tests from the actual behavior and failure risk, not only existing assertions.

## Automated verification

Use `npm ci`, `npm run check`, `npm run typecheck`, `npm test`, `npm run test:integration`, and `npm audit`. Verify package scripts before running them; they may evolve. Integration tests must apply every migration in order to an isolated D1 database, not only the first migration.

For each tool, test a known-answer case independently of its implementation, empty/invalid/boundary inputs, division by zero, decimal/rounding policy, extreme allowed values, Unicode where relevant, and deterministic provenance. Check that UI field names and constraints agree with the server contract. Do not label heuristic resume or profile scores as real ATS/rank measurements.

For persistence and API work, use two isolated users. Test create/read/update/delete, read versus write keys, cross-user denial, export coverage, account deletion cascades and revoked/expired credentials. Add regression assertions for every fixed defect.

For URL insights, test all requested platform types: never infer connector support from browser/search availability. Check exact source provenance, failed retrieval without manufactured data, extraction without scripts/navigation, quote grounding, competitor evidence isolation, bounded provider usage, atomic draft/review saves, revision history and human-review disclaimers. Mocked AI tests do not prove live inference quality.

## Browser QA

Use the available browser controls for the actual application. Exercise entry, submit, validation, results, copy/download, save/reload, search/filter/favorites, empty/error states and navigation. Test desktop and a mobile width; inspect overflow, focus order, dialogs, Escape, keyboard operation and accessible names. Save evidence using synthetic content, without credentials. Restore temporary viewport overrides.

Do not replace missing browser automation with claims that tests ran. Explicitly separate automated API checks, manual browser checks, screen-reader checks and formal accessibility conformance.

## Live and release checks

Use `scripts/smoke-preview.mjs` only against the named preview; it creates its own disposable data. Do not load-test production or delete another user's records. Clean up only test records created by this workflow and report cleanup failures.

Match GitHub CI to the exact head SHA. Record the Worker deployment and environment. Check successful public routes plus private-route denial. Use current performance tools when available; if traces, Lighthouse or field data are unavailable, mark the corresponding metrics unmeasured. Bundle size and server startup are not Core Web Vitals.

Keep a report of passed, failed, skipped and blocked checks with reproduction details. Fix and rerun failures before marking a requirement preview-verified. Passing tests are evidence, not a security/compliance certificate.
