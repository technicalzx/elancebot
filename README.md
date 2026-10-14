# Elancebot

[![CI](https://github.com/ycgiio/elancebot/actions/workflows/ci.yml/badge.svg)](https://github.com/ycgiio/elancebot/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

An open-source professional workspace for **URL-led gig, profile, service and competitor reviews**. Inspect source evidence, compare offers and target phrases, improve your draft, and save a revision. Practical calculators and text/unit utilities support the wider workspace.

[Try the preview](https://elancebot-preview.abuhuraira-113.workers.dev/) · [API specification](https://elancebot-preview.abuhuraira-113.workers.dev/api/v1/openapi) · [Product & roadmap](docs/product-blueprint.md)

> **v0.2 preview, not the completed product or a production certification.** Scores are deterministic content checklists—not Fiverr, Upwork, LinkedIn or Google rankings. No marketplace scraper, AI model, email provider, billing service or live rank tracker is connected. No promise of placement, revenue or leads. The [full requirements map](docs/requirements-traceability.md) preserves the broader platform scope.

## Working features

- Private accounts with salted scrypt password hashing, secure sessions and single-use offline recovery codes.
- URL-led reviews with source snapshots, evidence excerpts, competitor gaps, target-phrase counts, prioritized actions and editable revision comparisons. Approved websites can supply content directly; Fiverr, Upwork and LinkedIn currently require authorized text imports. A pasted snapshot is never labeled as fetched.
- Optional native Workers AI adapter with per-run consent, usage bounds and verbatim citation validation is implemented and mock-tested, **but inference is disabled and live quality is not verified**. The available non-AI draft structure is explicitly labeled.
- Profile, gig and service reviews with evidence, weighted criteria and prioritized improvements.
- Side-by-side competitor comparisons using user-supplied snapshots.
- Saved projects, editable inputs, revision history, score changes and project search.
- Searchable, categorized directory of 12 working tools; private favorites, recent tools and workspace search.
- Freelance pricing, profit/margin/markup, gross salary conversion, percentage and weighted GPA calculators; text counting/case and length/mass/temperature utilities.
- Shared input validation, explicit formulas/assumptions, copy/reset/JSON export, optional save and reopenable tool history. No invented tax, currency or platform-fee data.
- Website metadata checks on exact operator-approved HTTPS hostnames. No redirects, query strings, scripts or marketplace scraping. The preview can self-review its rendered homepage; other domains require operator approval.
- Read/write scoped, revocable 30-day API keys and public OpenAPI 3.1 documentation.
- Account/project JSON export and authenticated deletion.
- Responsive light/dark interface, semantic forms, keyboard-friendly dialogs and no third-party frontend scripts.

## Run locally

Requires Node.js **24 LTS**, npm, and Git. A Cloudflare account is not required for local development or tests.

```sh
npm ci
npm run db:migrate:local
npm run dev
```

Open the URL Wrangler prints (normally `http://localhost:8787`). Create a test account and **save its recovery code**. There is no email verification or reset email. Public assets are embedded during the build; restart `npm run dev` after changing `public/` files.

```sh
npm run check
npm run typecheck
npm test
npm run test:integration
npm audit
```

Integration tests run the real Worker in Miniflare with isolated D1 and all migrations. They cover authentication, cross-user isolation, key scopes, recovery revocation, CSRF, URL rejection, tool persistence/quotas, export and cascading deletion. Separate tests verify public SEO and private crawl boundaries in preview and production modes; unit tests check known calculator answers and invalid inputs.

## Use the API

Create a key in **Workspace → API access**. Keep it in an environment variable, not browser JavaScript or source control.

```sh
curl https://elancebot-preview.abuhuraira-113.workers.dev/api/v1/projects \
  -H "Authorization: Bearer $ELANCEBOT_KEY"
```

Public: `/api/v1/health`, `/api/v1/tools`, `/api/v1/openapi`. All project data requires authentication. Browser mutations are same-origin; server clients use bearer keys. “Open API” means a documented integration surface, not public access to private data. See [API & security](docs/api-security.md).

## Deploy to Cloudflare

1. Fork this repository and replace D1 identifiers, Worker names, `PUBLIC_ORIGIN` and the host allowlist in `wrangler.jsonc` with your own values.
2. Authenticate Wrangler. Create separate preview/production D1 databases. Keep credentials out of the repo.
3. Apply migrations and deploy preview:

```sh
npm run db:migrate:preview
npm run deploy:preview
```

4. Complete the [release checklist](docs/release-checklist.md) before production. Production deployment uses the top-level config and `npm run deploy`.

The current preview was deployed through the connected Cloudflare API using the same Wrangler-built module. Public assets are bundled with the Worker for atomic deployment. The production database is reserved but **production and elancebot.com are not deployed**. See [operations](docs/operations.md).

## Architecture

```text
Browser / server API client
           │ HTTPS
           ▼
Cloudflare Worker ─── D1 (accounts, projects, reviews, tool history, favorites, keys)
   │      └── deterministic scoring + schema-driven tool engine
   └── bounded HTTPS fetch to operator-approved websites only
```

No runtime npm dependencies; native crypto comes from the Workers runtime. Private API responses are `no-store` and `noindex`; the entire preview is `noindex`. Public production metadata, robots and sitemap support discoverability without guaranteeing rankings.

## SDLC and governance

- [Scope, acceptance criteria and roadmap](docs/product-blueprint.md)
- [Original requirements and delivery status](docs/requirements-traceability.md)
- [Architecture and data model](docs/architecture.md)
- [Decision records](docs/adr/README.md)
- [Threat model](docs/threat-model.md)
- [Authorized data-source policy](docs/data-source-policy.md)
- [API security](docs/api-security.md)
- [Release gates and standards mapping](docs/release-checklist.md)
- [Preview verification and known limitations](docs/verification.md)
- [Scoped security assessment](docs/security-assessment.md)
- [Deployment, recovery and operations](docs/operations.md)
- [Privacy](PRIVACY.md) · [Security reporting](SECURITY.md) · [Contributing](CONTRIBUTING.md)

Next priority: approved source connections for the requested marketplaces and evaluated, consented improvement generation; see [URL workflow acceptance and blockers](docs/url-insights-acceptance.md). URL-only marketplace analysis is not yet delivered. Dedicated platform workflows, client acquisition, career/resume, content tools, file processing, measured analytics, teams and billing remain incomplete. Production gates include verified identity/passkeys or managed OIDC, anti-abuse, external security review, measured accessibility/performance and retention/restore drills. The user will attach elancebot.com from their other Cloudflare account later.

## Reusable development skills

Versioned Codex workflows live in [skills/](skills/): `elancebot-sdlc`, `elancebot-qa`, `elancebot-vapt` and `elancebot-seo`. They keep scope traceability, actual feature acceptance, scoped security tests and truthful SEO evidence part of each release. Copy a desired skill directory into your Codex skills directory to use it. The project operator's installed copies passed the skill validator; a skill is not a security certification or permission to test third-party systems.

## License

Apache-2.0. Contributions welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Independent project; not affiliated with or endorsed by the named marketplaces.
