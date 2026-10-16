# Preview verification — 2026-10-14

## v0.5 local migration preparation — 2026-10-16

Five professional workflows extend the shared catalog to 17 tools. Clean locked install, structure check, generated types/TypeScript, 28 unit tests, seven isolated Worker/D1 integration tests, deployment dry run and dependency audit passed (zero reported vulnerabilities). New integration coverage exercises all five save/reopen paths, exact persisted results, cross-owner denial, invalid input without a new record, account export/deletion and no outbound requests. No schema change or provider was added.

Local browser QA used an ephemeral Worker/D1 and a synthetic account. All five default workflows ran and saved. Tool history listed all five; a saved job-evidence result reopened after reload. JSON download and browser clipboard copy contained the expected tool ID. At a requested QA viewport of 390×844, client/scroll widths were both 375 CSS pixels. Screenshots are in ignored outputs/. No browser warn/error entries were captured. Viewport reset after the test. No screen-reader, independent security, load or Core Web Vitals pass is claimed.

This release is local only. The published preview remains v0.4. GitHub CI for v0.5, deployment, live smoke and custom-domain verification must happen after the owner connects the main account. Repository backup restoration is separate from restoration of a hosted D1 database; production backup/operations gates remain open.

## v0.4 LinkedIn release checks — 2026-10-15

Dedicated LinkedIn JSON/labeled-text mapping and goal-specific evidence review reuse private projects and immutable analyses. No schema migration, provider connection, AI binding or domain change. Deployment `aec11d69dad84eae821e23b03ac0676d` at 02:35 UTC reports 8 ms startup; final bundle is 250.88 KiB / 71.20 KiB gzip. Startup is not a Core Web Vitals measurement.

23 unit tests and six Worker/D1 integration tests passed. Typecheck, project structure, build, dependency audit (zero reported vulnerabilities) and whitespace checks passed. Dedicated tests cover URL/input restrictions, unknown fields, exported JSON reimport, missing source rejection without persistence, authorization, read-only API scope rejection, cross-user isolation, export and deletion. No outbound LinkedIn request is made.

Isolated browser QA with synthetic data verified navigation, four-section mapping, jobs/client goal priorities, a second revision, reload/reopen, historical revision selection and profile JSON download. At 390×844 the client and scroll widths both measured 375 CSS pixels; inspected mobile layout had no horizontal overflow. No warning/error console entries were captured. Viewport restored and local ephemeral server stopped. This is not a full accessibility or independent penetration audit.

Live smoke passed the dedicated LinkedIn save/reopen and explicit URL-only rejection, plus all existing account, URL review, calculator, experiment, export and login checks. The disposable preview account was successfully removed. The user's browser account was not modified.

The SDLC/QA/security/SEO skills informed provenance, ownership tests, additive release boundaries and preview crawl controls. The market-informed roadmap and current/future architecture findings are in [product evolution](product-evolution.md). Demand hypotheses still require customer validation. URL-only LinkedIn extraction and personalized AI output remain unavailable; the UI states both limitations.

## v0.3 experiment release checks — 2026-10-15

Adds immutable private plans, optional owned-project links, manually supplied baseline/follow-up observations, optimistic version checks, exports and cascades. Migration 0003 applied to preview only and ledger verified. Final layout deployment `aa7c0cd09c144990ba9593dd791364cf`, 2026-10-15 at 02:13 UTC (07:13 Asia/Karachi), is 230.50 KiB / 64.88 KiB gzip with 7 ms reported startup. These are bundle/startup measurements, not Core Web Vitals. Initial functional deployment `9f6f7964e83e48d7b16ceac42bd77a77` passed live smoke, including experiment save/reopen, 5-percentage-point synthetic comparison, stale-write rejection, export and disposable-account cleanup. Exact-head CI is checked during publication; use the repository's CI history for the published SHA.

21 unit tests and five Worker/D1 integration tests passed, including two-user isolation, read-key rejection, quota, invalid dates/counts, missing/zero denominators, version conflicts and project/account deletion. Clean install, typecheck, structure check, build, dependency audit (zero reported vulnerabilities) and whitespace checks passed. A clean install retry was needed after Windows locked the running local test runtime; stop that runtime before reinstalling dependencies. Typecheck was rerun successfully after the install completed.

Browser checks used an isolated local Worker/D1 and synthetic account rather than modifying the user's existing preview session. Verified create/save, reload/reopen, outcome edits, rejected invalid dates with preserved inputs, corrected save, JSON download and inert literal markup. Desktop 1366×900 and mobile 390×844 had equal client/scroll widths (1351 and 375 respectively); mobile fields stacked. Keyboard Tab moved from save to delete, and no warn/error console entries were captured. Viewport override restored. The isolated server was stopped; its ephemeral records are not production data. Live API smoke separately verified the deployed persistence path. Full accessibility, performance and independent VAPT remain pending.

The Elancebot SDLC/QA/security/SEO skills informed owner-qualified persistence, additive migrations, honest metric provenance, export/deletion coverage and preview noindex. No paid inference/rendering or domain change was enabled.

Final deployment live smoke also passed all existing review/tool checks plus experiment save, reopen, comparison, stale-write denial and account export. Its disposable account was removed successfully; the user's existing browser account was not modified.

## v0.2 current release

Worker deployment `72b2ec3f6d3b48b78bfb387d558ebc37`, deployed 2026-10-14 at 00:38 UTC (05:38 Asia/Karachi). Migrations 0001 and 0002 applied to preview only. Build: 204.87 KiB / 57.74 KiB gzip. Typecheck, structure check, 19 unit tests, four Worker/D1 integration suites, dependency audit (zero reported vulnerabilities) and whitespace checks passed.

Live smoke passed registration/session, competitor review, homepage metadata and text extraction, saved URL review reopening, explicit unavailable marketplace connector, calculator/history/favorites/search, export, login/logout and disposable-account cleanup. All five privately supplied marketplace URLs returned 422 `platform_connection_required`; their contents were not analyzed or published.

Browser QA verified synthetic source comparison, reopening, three saved revisions, corrected commercial evidence, rule-version comparison guard, same-rule coverage change 58 to 100 (not rank or earnings), JSON export with both sources, and inert escaped markup. Desktop 1366×900 and mobile 390×844 had no document overflow. Mobile Escape restored menu-button focus. No warning/error console entries were observed in the final check. Viewport override reset; the disposable Browser QA account and synthetic records were deleted. Local screenshots are retained outside Git.

All four installed project skills passed validation. The source-acquisition architecture considers self-hosted Crawl4AI without end-user provider keys, but no crawler service is deployed. AI inference remains disabled. Full VAPT, accessibility conformance, Core Web Vitals, production identity, operational gates, marketplace connectors and the custom domain remain incomplete. Exact-head GitHub CI must be checked after publication; earlier runs do not cover this release.

## Historical v0.1 evidence

This is evidence for the v0.1 preview, not a security certification or a claim that the full product roadmap is complete.

## Delivery

- [Public source](https://github.com/ycgiio/elancebot) with Apache-2.0 license, contribution/security policies, pinned CI actions and Dependabot.
- [Cloudflare preview](https://elancebot-preview.abuhuraira-113.workers.dev/) and [OpenAPI 3.1 schema](https://elancebot-preview.abuhuraira-113.workers.dev/api/v1/openapi).
- Worker deployment `bcb65b507bd44ca08d8d116a07b93bb5`, deployed at 13:01 UTC on 2026-10-13. Preview D1 migration `0001_initial.sql` applied; production remains separate and undeployed.
- Repository description, eight relevant topics and the preview homepage link configured. These aid discovery; they do not guarantee GitHub or search-engine placement.

## Automated checks

| Check | Observed result |
| --- | --- |
| `npm run check` | Required project files and bindings present |
| `npm run typecheck` | Generated Worker types and TypeScript pass |
| `npm test` | 8 tests pass |
| `npm run test:integration` | Real Worker/D1 lifecycle test passes |
| `npm audit` | 0 reported dependency vulnerabilities at verification time |
| Wrangler preview dry-run | Successful; 140.07 KiB upload / 38.07 KiB gzip |
| `git diff --check` | No whitespace errors |

The integration test covers authentication/cookies, cross-user read/write/delete isolation, API-key scopes and revocation, recovery replay/revocation, CSRF, approved-host controls, redirect refusal, oversized/non-HTML responses, metadata parsing, self-review provenance, export redaction and account deletion cascades. Public HTML caching, asset versions, CSP, preview noindex, 404 and OpenAPI responses are also asserted.

[Initial published-source CI run](https://github.com/ycgiio/elancebot/actions/runs/38358011169) completed successfully. Each push reruns the same checks on Linux/Node 24; match the release commit to its run in [CI history](https://github.com/ycgiio/elancebot/actions/workflows/ci.yml) rather than assuming a previous green run covers a later commit.

## Live preview and browser checks

`scripts/smoke-preview.mjs` passed against the deployment above: registration, secure session, saved competitor comparison, rendered-homepage metadata review, account export, logout/login and disposable-account deletion. It uses synthetic data only and never prints credentials.

Manual Chrome checks exercised the saved profile review workflow: create a draft, run a review, edit it, save a second review, and select history. The synthetic example changed from 65 to 68; these are checklist scores, not rankings or proof of business impact.

Desktop and 390 × 844 mobile screenshots were inspected. The mobile document width and scroll width both measured 375 CSS pixels (the viewport includes scrollbar space), with no horizontal overflow. The closed sidebar is hidden, opening moves focus into navigation, Tab wraps from the final item to the first, and Escape closes it and returns focus to the menu button. No warning/error console entries were captured during the final review-page check. This is limited browser QA, not a full screen-reader or WCAG conformance audit.

## Limits and next release gates

- Preview accepts only nonsensitive test content. Registration does not verify email; save the offline recovery code. Managed identity/MFA, anti-abuse and a security review remain production gates.
- Website fetching is restricted to exact operator-approved hosts. The preview homepage review uses its rendered HTML in-process, explicitly labeled; it is not an outbound fetch or a Core Web Vitals audit. Other owners' domains have not been approved or live-tested.
- No marketplace scraping, provider integration, AI inference or measured live ranking is connected. Competitor comparisons use user-supplied snapshots.
- The web-performance skill's required Chrome DevTools tracing tools were unavailable. That audit was paused; Lighthouse, LCP, INP, CLS, load capacity and costs remain unmeasured. No estimated values are substituted for measurements.
- Production elancebot.com is not deployed: its zone was not found in the connected account, and DNS was not changed. Preview uses noindex; activate production canonical/robots/sitemap only after the [release gates](release-checklist.md) are met.
- Branch protection, independent security/accessibility review, verified operator/legal notices, retention scheduling and backup restoration remain pending. Source maps are generated locally; API deployment did not upload them.

See [product phases](product-blueprint.md) for the remaining toolkit and [operations](operations.md) for deployment and incident procedures.

## Organization publication handoff — 2026-10-16

The source is prepared for `technicalzx/elancebot`, owned by `@AbuHurairh`. Historical CI links above refer to the original account. New-organization CI and preview deployment must be recorded separately after publishing; no old passing run is claimed as verification of the new commit. The hosted preview currently remains v0.4.
