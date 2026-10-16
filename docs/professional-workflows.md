# Supplied-evidence workflows

Five workflows are implemented locally for the account migration handoff. They reuse `GET /api/v1/tools`, `POST /api/v1/tool-runs`, private history, favorites, search, account export and deletion. No migration or new provider is needed. Publishing and deployed verification wait for the user's main account.

| Tool ID | Input and behavior | Limits |
| --- | --- | --- |
| job-evidence-fit | Objective, explicit requirement phrases, experience; exact excerpts, unmatched phrases, proposal outline | 1–20 unique lines, 160 characters/line; source up to 12,000 characters |
| resume-evidence-review | Requirements and resume text; literal matches and common English section labels | Plain text, not PDF/DOCX or a vendor ATS score |
| fiverr-package-review | Offer, prerequisites, 1–3 JSON packages; adjacent scope/price/delivery/revision comparisons | One entered currency; positive prices up to 2 decimals; no live Fiverr connection/policy check |
| client-brief-planner | Objective, deliverables, constraints, evidence, unresolved questions | Reviewable template with explicit acceptance/commercial placeholders; no sending or legal contract |
| content-outline | Topic, audience, source facts, CTA, requested tone, format | Post/article/email/case-study outline; no prose generation, translation or tone rewriting |

Package schema: `{name, price, currency, deliveryDays, revisions, deliverables}`. Names are unique; deliverables are unique within each package; prices are numeric; delivery and revisions are bounded integers. List cumulative deliverables explicitly, or review warnings when packages intentionally represent alternatives.

Phrase matching is case-insensitive with Unicode letter/number boundaries; punctuation is literal. Exact source excerpts and offsets are retained. Matching does not understand negation, synonyms, currency semantics, skill quality, seniority or chronology. A missing phrase is not a missing skill. No fit percentage, market benchmark or ranking is invented.

The server validates bounded text/JSON and existing account quotas before saving versioned results. Results render through the existing escaped DOM path. Existing owner predicates, scoped keys, export/deletion and non-cacheable private API responses apply. Unit tests cover literal Unicode/metacharacter matching, invalid packages, mixed currencies, duplicate inputs and format-specific outlines. An isolated Worker/D1 test checks all five save/reopen flows, cross-owner denial, export coverage, rejection without a new record, no outbound fetching and account-deletion cascades.

This is partial delivery of CLIENT-01, CAREER-01, UW-01, FV-01 and CONTENT-01. Evaluated generative writing, marketplace acquisition, PDF parsing, connected analytics, billing, teams and production identity remain separate requirements.
