# API and security

Contract: `src/openapi.ts`, served at `/api/v1/openapi`. Errors have `error.code`, `message` and correlation `requestId`; unexpected failures do not expose SQL or stacks.

| Surface | Access |
| --- | --- |
| GET health/tools/openapi | Public, no private data |
| POST auth/register/login/recover | Public, IP/email rate-limited |
| GET projects/history/dashboard/search | Session or read/write key; owner restricted |
| Project/review mutations | Session or write key; owner restricted |
| GET tool-state/tool-runs/results | Session or read/write key; owner restricted |
| PATCH tool-state; POST/DELETE tool-runs | Session or write key; owner restricted |
| POST url/analyze | Session/write key, approved host + attestation |
| POST insights | Session/write key; owner-only saved source review and optional competitor comparison |
| Key administration; account export/delete | Interactive session only |

Create a project, then POST `/projects/{id}/analyses`. PATCH input to review a revision. GET `/projects/{id}` includes history. Kinds: profile, gig, service, competitor, website. Competitor uses `input.competitor` with equivalent fields. Website input: `url`, `attested:true`.

```json
{"name":"Portfolio headline","kind":"profile","input":{"headline":"Accessible web development for independent businesses","overview":"I help... Contact me...","services":"Design, development","skills":"HTML, CSS, accessibility","keywords":"accessible websites","portfolio":"A real case study"}}
```

## Implemented boundaries

- No wildcard CORS. Browser mutations require same-origin; cookie mutations without Origin are rejected. Server scripts use bearer keys.
- Auth: 20/IP/15min, 10/email/15min. Account API: 180/min. Saved reviews: 60/hour. Calculator/utility runs: 60/hour. Standalone URL: 10/hour. Retry-After is a conservative 15 minutes.
- 48 KB JSON request; 24,000-character project input; 50 projects/account; 50 reviews/project; 100 saved tool results; 10 active keys/account. Tool-specific schema limits also apply.
- Restrictive CSP, no credential logging, no-store private responses, noindex APIs/preview.
- Key secrets shown once, hashed, scoped, expire in 30 days and revoke immediately. Keys cannot manage keys or account settings.
- URL checks: exact operator allowlist, HTTPS only, no IPs/userinfo/custom ports/query/fragment/marketplace domains; redirects rejected; eight-second timeout; 512 KB HTML. No cookies/auth forwarding or script execution.
- Self-review uses in-process rendered HTML and marks `retrieval: local-rendered-html`.

Only approve operator-verified, stable public hosts. Do not allow shared hosting/redirectors or arbitrary user-controlled DNS. Do not add private-network/VPC bindings without a new SSRF review.

## Tool API

GET `/tools` provides the 12-tool catalog, modes, categories and field constraints. Review modes use `/projects`; calculators/utilities use POST `/tool-runs`, for example `{"toolId":"percentage","input":{"part":18,"whole":24},"save":true}`. A saved result returns 201 and an ID; `save:false` (the API default) returns 200 without persisting inputs/results. Both update the recent-tool marker. The browser save checkbox is on by default and describes this storage explicitly.

PATCH `/tool-state/{toolId}` accepts a boolean `favorite` and/or `used:true`; it cannot select another owner. GET/DELETE `/tool-runs/{id}` returns 404 for another user's result. GET `/search?q=...` returns matching catalog entries and only the caller's project/result titles. Account export and deletion cover both new tables. Unsupported API versions return 404 rather than aliasing v1.

## URL insights API

POST `/insights` accepts `url`, `specialty`, `attested:true`, optional `audience`, up to 10 comma-separated `keywords`, `competitorUrl`, `sourceText`, `competitorText`, review `name` and owned `projectId` for a revision. Each text snapshot is 100–8,000 characters. Without supplied text, only exact approved website hosts are fetched; marketplace URLs return 422 `platform_connection_required`. Invalid requests do not receive fabricated reports. Limit: 10 processing attempts/hour/account; existing project/revision quotas also apply. Draft and report writes are transactional. Export includes exact source snapshots, so treat exported JSON as private.

Optional `useAi:true` additionally requires configured inference and `aiConsent:true`; otherwise 503. AI is disabled in the current deployment. The implemented adapter enforces 3 requests/account/day and 10/app/day; a provider or invalid-citation failure preserves a non-AI report with an explicit error. API clients must inspect `analysis.result.ai` and `aiError`, not assume every 201 includes an AI draft. No source is sent to a model when `useAi` is false.

## Remaining production gaps

No verified email/OIDC/passkeys/MFA, managed anti-bot, external audit, append-only security trail, pagination or incident SLA. Registration can reveal email existence; review this preview tradeoff. Cleanup is opportunistic, not scheduled. Distributed abuse requires infrastructure controls and budgets.
