# Public-source acquisition without end-user provider keys

Decision date: 2026-10-14. The user requested an open-source backend that avoids third-party keys for end users. This is feasible for permitted public content, not a guarantee of unrestricted access to every website.

## Research and selection

| Option | Key/access reality | Elancebot fit |
| --- | --- | --- |
| Existing bounded HTTPS reader | No third-party key or website login; exact approved public hosts only | Implemented and deployed. Extracts text/metadata without executing scripts. |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) self-hosted library | Public-page extraction can run without a hosted-provider key. Its current Docker server requires an internal API token; compute/browser hosting is still needed. | Candidate for a separately isolated rendering service, not installed or deployed. Keep its token server-side; never expose an unauthenticated crawl/JavaScript endpoint. |
| [Jina Reader](https://github.com/jina-ai/reader) | Hosted anonymous access has tighter limits; some features need a key. Self-hosting needs a runtime and review of its dependencies/assets. | Considered, not connected. No silent third-party proxy of user URLs/content, and no assumption that proxy access gives platform permission. |
| [Cloudflare Browser Run binding](https://developers.cloudflare.com/browser-run/get-started/) | Worker binding avoids embedding a REST API token or asking users for one. Cloudflare account authorization and browser usage limits/billing still apply. | Native alternative for approved JS-rendered public pages; not enabled. Budget and live validation required first. |

The open-source rendering candidate is Crawl4AI behind a private, narrow adapter. Cloudflare's binding is the alternative if operating another service is undesirable. Neither changes platform access requirements. A public repository, OpenAPI specification and unauthenticated unrestricted backend are different things.

## Acquisition order

1. Validate HTTPS source, platform, operator approval and permission. Apply request/record/usage quotas.
2. Use the bounded direct reader for an approved public site.
3. A future renderer may handle permitted JavaScript content that the direct reader cannot extract. Do not trigger it to evade 401/403, login, robots denial, CAPTCHA or other explicit access restrictions.
4. Platform/private content requires an approved connector and the correct authorization, or an authorized user export/snapshot. Report unavailable content explicitly.
5. Normalize the result to URL, retrieval method, fetched/recorded time, exact analyzed text, content bounds and limitations. Reviews and generated drafts may cite only this data.

## Renderer deployment gates

- Separate sandboxed service with no workspace database, cookies, credentials, private-network access or host filesystem access.
- Authenticated internal invocation; session/scoped-key access to Elancebot. No arbitrary headers, cookies, scripts, proxy options or webhook destinations from user input.
- Egress restrictions on DNS resolution, redirects, navigations and all subresources. Private/link-local/loopback/metadata addresses denied. Revalidate at connection time; app-side URL regexes alone are insufficient.
- Respect applicable collection permission and robots controls; no stealth, CAPTCHA solving, cookie reuse, proxy rotation or login bypass.
- One page per request initially; bounded browser time, response size, concurrency and daily budget; browser always closed; no retry storm.
- Pin and audit a patched dependency release/image digest, disable dangerous optional endpoints, test SSRF and malformed payloads in isolation, and complete licensing/attribution review.
- Explicit processor/retention notice for any new external service. Do not send private source snapshots to a hosted reader without disclosure and consent.
- Prove success and honest failure against authorized acceptance sources before marking this available in the UI.

Current status: direct reader and supplied-source reviews work; no renderer, third-party reader or marketplace connector is deployed. The five privately supplied marketplace URLs remain unsupported for URL-only retrieval. No website authentication requirement has been removed, and no unrestricted service has been exposed.
