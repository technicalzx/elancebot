# Preview verification — 2026-10-14

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
