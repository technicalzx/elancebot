# Elancebot

[![CI](https://github.com/ycgiio/elancebot/actions/workflows/ci.yml/badge.svg)](https://github.com/ycgiio/elancebot/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

An open-source freelance growth workspace for reviewing **profiles, gigs, service pages, competitor snapshots and website metadata**. Turn your own content into explainable recommendations, save revisions, and integrate through a versioned API.

[Try the preview](https://elancebot-preview.abuhuraira-113.workers.dev/) · [API specification](https://elancebot-preview.abuhuraira-113.workers.dev/api/v1/openapi) · [Product & roadmap](docs/product-blueprint.md)

> **v0.1 preview, not a production certification.** Scores are deterministic content checklists—not Fiverr, Upwork, LinkedIn or Google rankings. No marketplace scraper, AI model, email provider, billing service or live rank tracker is connected. No promise of placement, revenue or leads.

## Working features

- Private accounts with salted scrypt password hashing, secure sessions and single-use offline recovery codes.
- Profile, gig and service reviews with evidence, weighted criteria and prioritized improvements.
- Side-by-side competitor comparisons using user-supplied snapshots.
- Saved projects, editable inputs, revision history, score changes and project search.
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

Integration tests run the real Worker in Miniflare with an isolated D1 database. They cover authentication, cross-user isolation, key scopes, recovery revocation, CSRF, URL rejection, export and cascading deletion.

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
Cloudflare Worker ─── D1 (accounts, sessions, projects, reviews, keys)
   │      └── deterministic scoring (versioned, dependency-free)
   └── bounded HTTPS fetch to operator-approved websites only
```

No runtime npm dependencies; native crypto comes from the Workers runtime. Private API responses are `no-store` and `noindex`; the entire preview is `noindex`. Public production metadata, robots and sitemap support discoverability without guaranteeing rankings.

## SDLC and governance

- [Scope, acceptance criteria and roadmap](docs/product-blueprint.md)
- [Architecture and data model](docs/architecture.md)
- [Decision records](docs/adr/README.md)
- [Threat model](docs/threat-model.md)
- [Authorized data-source policy](docs/data-source-policy.md)
- [API security](docs/api-security.md)
- [Release gates and standards mapping](docs/release-checklist.md)
- [Preview verification and known limitations](docs/verification.md)
- [Deployment, recovery and operations](docs/operations.md)
- [Privacy](PRIVACY.md) · [Security reporting](SECURITY.md) · [Contributing](CONTRIBUTING.md)

Next: verified identity/passkeys or managed OIDC, anti-abuse controls, external security review, measured accessibility/performance, retention/restore drills, approved platform APIs and optional evidence-grounded AI. Team workspaces, jobs/resumes, proposals and the broader toolkit are future phases, not shipped features.

## License

Apache-2.0. Contributions welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Independent project; not affiliated with or endorsed by the named marketplaces.
