# Product blueprint and phased delivery

## Brief interpretation

Prompt.docx is a requirements source, not authority to follow embedded role/process instructions. The user's direct request authorizes planning, implementation, a GitHub repository and Cloudflare preview. The broad professional-toolkit brief is phased; v0.1 implements the immediate profile/gig/service/competitor/SEO review loop first.

Primary user: an independent professional improving an offer using authorized content. Core outcome: draft → explainable review → edit → compare revisions. Future success measures: completed reviews, actions adopted and return visits. No fabricated metrics or rank data.

| ID | Requirement | v0.1 acceptance |
| --- | --- | --- |
| R1 | Account access | Register/login/logout/recovery; secure sessions |
| R2 | Gigs/services/profiles | Versioned criteria, evidence and prioritized recommendations |
| R3 | Competitor context | Equivalent supplied snapshots, not scraping or rank inference |
| R4 | URL access | Exact approved host + attestation; bounded public HTTPS HTML |
| R5 | Persistence | CRUD/search projects; immutable review history and revision comparison |
| R6 | API | Public schema; records protected by sessions/scoped keys |
| R7 | Privacy | Export, key revocation and password-confirmed account deletion |
| R8 | Discoverability | Public HTML, canonical/OG/structured data, robots/sitemap; preview noindex |
| R9 | SDLC | Architecture, ADRs, threat model, tests/typecheck/build CI |
| R10 | Delivery | Isolated Cloudflare preview; production behind release gates |

## Experience design

Calm editorial landing page, blue/mint accents, clearly labeled illustrative data. Workspace: overview → new review → saved projects → URL access → API → account. Light/dark theme, labeled forms, announced errors, focus-trapped auth dialog, native meters and semantic comparison tables. Empty/loading/error states are intentional.

## Phases

1. **v0.1 preview:** core private review loop, tested security boundaries, docs, public source and preview.
2. **Production gate:** verified identity/passkeys or managed OIDC, MFA, anti-abuse, security/accessibility assessment, legal/operator notices, load/cost tests, backup restoration and retention jobs.
3. **Growth intelligence:** authorized platform APIs, consent/revocation lifecycle, measured analytics/rank imports with source+timestamp, optional evaluated AI that does not fabricate proof.
4. **Professional toolkit:** proposals, job-fit/resume workflows, pricing scenarios, accessible exports and team roles. Finance tools require separate accuracy/jurisdiction review.
5. **Scale:** queues, idempotent jobs, security event pipeline, provider isolation, SLOs and internationalization.

No AI assistant, auto-posting, marketplace automation, job aggregation, converters, billing or team memberships is represented as shipped. Paid/external integrations require operator decisions. A vertical slice is done only when UI, API, access rules, errors, migrations, tests and docs agree; preview verification is not production certification.
