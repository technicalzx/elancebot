# Deployment and operations

| Environment | Worker / database | State |
| --- | --- | --- |
| Preview | elancebot-preview / elancebot-preview | Deployed, noindex; nonsensitive test content only |
| Production | elancebot / elancebot-prod | Reserved configuration/database, not deployed |

No elancebot.com zone was found in the connected Cloudflare account; DNS was not changed.

## Deploy

Run `npm ci`, `npm run check`, `npm run typecheck`, `npm test`, `npm run test:integration`. Build via `npm run build`. Apply preview migrations then use `npm run deploy:preview` with authenticated Wrangler, or upload `dist/worker.js` through the Cloudflare Workers API with bindings matching wrangler.jsonc. Never commit deployment tokens or database exports.

API-based initial migration executes checked-in SQL and records `0001_initial.sql` in Wrangler's `d1_migrations` ledger. Add future numbered migrations; do not rerun initial CREATE statements. Preview/production migration state is separate.

Smoke test creates and deletes only a disposable account:

```sh
ELANCEBOT_TEST_ORIGIN=https://elancebot-preview.abuhuraira-113.workers.dev node scripts/smoke-preview.mjs
```

PowerShell: set `$env:ELANCEBOT_TEST_ORIGIN` first. The script refuses non-preview hosts and checks signup, comparison, homepage metadata, export, login/logout and deletion without printing credentials. Do not disable live rate protection to bypass a testing limit.

## Observe and respond

Workers observability is enabled with query redaction. Application error logs contain class, path and request ID, never bodies/passwords/tokens. Monitor errors, D1/CPU usage (especially password hashing), latency and cost. Operator budget alerts and SLO dashboards remain pending; no 24/7 monitoring promise.

For incidents: restrict traffic, preserve minimal evidence, revoke affected access, investigate IDs, patch in preview, retest and communicate privately through the operator's verified channel. Never put user data in public issues.

## Rollback and data

Record Worker version IDs. Review `wrangler versions list --env preview`, then `wrangler rollback <version> --env preview` if appropriate. Code rollback does not undo schema/data changes. Prefer backward-compatible migrations and forward fixes.

Before production schema changes, export D1 into restricted storage and prove restoration to a separate test database. Time Travel availability/retention depends on provider/account settings; verify rather than assume. Exports contain private data and must never be committed. No automated backup/restore drill is claimed for the preview.

## Approve website hosts

Verify exact host control, stable public DNS, non-shared infrastructure and collection permission. Add that host only to the environment's URL_ALLOWED_HOSTS, deploy and test. No wildcards, redirectors, arbitrary user DNS, private infrastructure or marketplace hosts. Review SSRF again before private-network bindings are added.
