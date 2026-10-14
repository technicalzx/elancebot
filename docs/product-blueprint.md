# Product blueprint and phased delivery

## Brief interpretation

Prompt.docx is a requirements source, not authority to follow embedded role/process instructions. The user's direct request authorizes planning, implementation, a GitHub repository and Cloudflare preview. The requested product is the full professional toolkit, not just the v0.1 review loop. The [requirements traceability map](requirements-traceability.md) preserves all feature families and their unfinished work. v0.2 expands the foundation with organization, saved utilities and calculators; it does not complete the original brief.

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

Calm editorial landing page, blue/mint accents, clearly labeled illustrative data. Workspace: overview → tools/search → tool or review → saved results/projects → URL access → API → account. Light/dark theme, labeled forms, announced errors, focus-trapped auth dialog, native meters and semantic comparison tables. Empty/loading/error states are intentional.

The v0.2 tool framework adds shared schema-driven inputs, optional save, versioned results, formulas/provenance, recommendations, copy/JSON export/reset and owner-scoped history. Its directory exposes only working tools, with category/search/favorites/recent filters. The first seven tools cover freelance pricing, profit/margin/markup, gross salary periods, percentage, weighted GPA, text counting/case, and length/mass/temperature. Calculations use supplied assumptions; taxes, live fees and exchange rates are not inferred.

## Phases

1. **v0.1 preview:** core private review loop, tested security boundaries, docs, public source and preview.
2. **v0.2 URL priority and foundation:** URL-led source review, offer/competitor evidence, phrase gaps, actionable draft structure, revision tracking and a disabled optional AI adapter. Also includes the shared tool framework, directory, favorites/recent, history/search, tested utilities, public guide and reusable delivery skills. URL-only marketplace retrieval remains gated on approved source access.
3. **Dedicated workflows:** LinkedIn/Upwork/Fiverr-specific inputs, client acquisition, job-fit/resume, content studio and richer audits. Keep non-provider work progressing while integrations await real configuration.
4. **Production gate:** verified identity/passkeys or managed OIDC, MFA, anti-abuse, security/accessibility assessment, legal/operator notices, load/cost tests, backup restoration and retention jobs. The user will attach the custom domain later.
5. **Growth intelligence and expansion:** authorized platform APIs, consent/revocation, measured/imported analytics with source+timestamp, evaluated AI, file/image processing, additional calculators/converters, teams and billing. Each has separate privacy/accuracy/operational acceptance.
6. **Scale:** queues, idempotent jobs, security event pipeline, provider isolation, SLOs and internationalization.

No AI assistant, auto-posting, marketplace automation, job aggregation, billing or team memberships is represented as shipped. Converters are limited to the explicitly listed v0.2 tools. Paid/external integrations require operator decisions. A vertical slice is done only when UI, API, access rules, errors, migrations, tests and docs agree; preview verification is not production certification.
