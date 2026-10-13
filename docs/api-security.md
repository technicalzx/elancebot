# API and security

Contract: `src/openapi.ts`, served at `/api/v1/openapi`. Errors have `error.code`, `message` and correlation `requestId`; unexpected failures do not expose SQL or stacks.

| Surface | Access |
| --- | --- |
| GET health/tools/openapi | Public, no private data |
| POST auth/register/login/recover | Public, IP/email rate-limited |
| GET projects/history/dashboard/search | Session or read/write key; owner restricted |
| Project/review mutations | Session or write key; owner restricted |
| POST url/analyze | Session/write key, approved host + attestation |
| Key administration; account export/delete | Interactive session only |

Create a project, then POST `/projects/{id}/analyses`. PATCH input to review a revision. GET `/projects/{id}` includes history. Kinds: profile, gig, service, competitor, website. Competitor uses `input.competitor` with equivalent fields. Website input: `url`, `attested:true`.

```json
{"name":"Portfolio headline","kind":"profile","input":{"headline":"Accessible web development for independent businesses","overview":"I help... Contact me...","services":"Design, development","skills":"HTML, CSS, accessibility","keywords":"accessible websites","portfolio":"A real case study"}}
```

## Implemented boundaries

- No wildcard CORS. Browser mutations require same-origin; cookie mutations without Origin are rejected. Server scripts use bearer keys.
- Auth: 20/IP/15min, 10/email/15min. Account API: 180/min. Saved reviews: 60/hour. Standalone URL: 10/hour. Retry-After is a conservative 15 minutes.
- 48 KB JSON request; 24,000-character project input; 50 projects/account; 50 reviews/project; 10 active keys/account.
- Restrictive CSP, no credential logging, no-store private responses, noindex APIs/preview.
- Key secrets shown once, hashed, scoped, expire in 30 days and revoke immediately. Keys cannot manage keys or account settings.
- URL checks: exact operator allowlist, HTTPS only, no IPs/userinfo/custom ports/query/fragment/marketplace domains; redirects rejected; eight-second timeout; 512 KB HTML. No cookies/auth forwarding or script execution.
- Self-review uses in-process rendered HTML and marks `retrieval: local-rendered-html`.

Only approve operator-verified, stable public hosts. Do not allow shared hosting/redirectors or arbitrary user-controlled DNS. Do not add private-network/VPC bindings without a new SSRF review.

## Remaining production gaps

No verified email/OIDC/passkeys/MFA, managed anti-bot, external audit, append-only security trail, pagination or incident SLA. Registration can reveal email existence; review this preview tradeoff. Cleanup is opportunistic, not scheduled. Distributed abuse requires infrastructure controls and budgets.
