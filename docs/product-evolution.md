# Product and architecture review — 2026-10-15

## Market evidence and priorities

This is desk research, not proof of demand, uniqueness or willingness to pay. Existing offerings overlap: [Fiverr Seller Plus](https://help.fiverr.com/hc/en-us/articles/6523401252881-Advanced-Analytics-for-Seller-plus) includes keyword/performance analytics; [Taplio](https://intercom.help/taplio/en/articles/9634100-which-other-tools-does-taplio-offer) offers profile optimization. Elancebot should test the value of a portable evidence → edit → measured outcome record, not claim those categories are absent from the market.

| Order | Feature / problem | Acceptance and dependency |
| --- | --- | --- |
| Now | Dedicated LinkedIn profile workspace | URL recognition, authorized structured import, visible JSON/provenance, goal-specific section guidance, private revisions/export. URL-only extraction remains blocked on approved access. |
| Next | Job brief → evidence-fit and proposal outline | Highlight supported skills and missing requirements with exact source references; no invented experience or automatic sending. Use supplied job text; evaluate with five observed user sessions. |
| Next | Fiverr offer/package consistency review | Compare title, deliverables, exclusions, buyer requirements and packages for contradictions; use explicit supplied prices/currencies. Do not infer rank or demand. |
| Next | Action checklist tied to a review revision | Persist user decisions and completion; link the chosen action to an experiment and immutable original evidence. Test isolation and deleted-parent behavior. |
| Next | Outcome CSV import with preview | Field mapping, date/timezone/count checks, duplicates, dry-run confirmation, provenance and rollback by import batch. No automatic third-party transfer. |
| Later | Case-study/portfolio evidence builder | Convert authorized project facts into a reviewable outline; flag missing proof instead of fabricating achievements. |
| Gated | Approved profile connectors and evaluated AI | Actual provider permissions, consent/revocation, spend ceiling, documented supported fields and live quality tests. |
| After validation | Teams, billing, scheduled monitoring | Membership roles, tenant isolation, entitlements, idempotent billing webhooks and approved retention/cost policy. |

The first three forthcoming features are hypotheses to validate against recent user problems, completion time, repeat usage and usefulness. Do not publish invented adoption metrics. The full original scope remains in requirements-traceability.md.

## Current architecture assessment

Reviewed Worker routes, source/scoring modules, D1 schema, public clients, OpenAPI, tests and release gates. Keep the modular monolith for the bounded preview; microservices now would add operational obligations without measured demand.

| Finding | Impact | Implementation direction |
| --- | --- | --- |
| Authentication is unverified-email plus offline recovery | Production identity/recovery gap | Select managed OIDC/passkeys/MFA; introduce provider identities mapping to existing users without guessing email ownership. Migration and account-linking tests first. |
| Marketplace acquisition is unavailable | URL-only product promise is unmet | Separate acquisition capability from analysis. Preserve explicit unavailable responses; approve a provider before implementing its adapter. |
| Worker combines auth, persistence and routing | Growing change/test surface | Extract authenticated service modules behind existing API contracts incrementally; do not rewrite working auth while adding product features. |
| Projects and analyses already provide transactional revisions | Reusable reliable core | LinkedIn reuses these tables and save transaction; no new table or migration required. Keep analysisType/schemaVersion discriminators. |
| Project drafts use last-write-wins | Concurrent draft changes can conflict | Add version preconditions across all draft updates in a separate backward-compatible change; immutable analyses preserve prior evidence meanwhile. |
| Listings are quota-bounded, not paginated | Raising quotas grows response/cost | Add owner-qualified keyset pagination and summary DTOs before expanding limits. Avoid returning raw source blobs for directory listing. |
| Embedded public assets | Simple atomic preview release, growing bundle | Measure startup/cache behavior; move public files to Workers Static Assets when warranted, with explicit private-route routing tests. |
| Cleanup is opportunistic and restoration untested | Operational readiness gap | Approved retention policy, scheduled expiry cleanup, restore drill in separate database, alerts and rollback rehearsal before paid launch. |
| Source HTML and future model output are untrusted | Injection, privacy and incorrect claims | Keep bounded parsers, no executable source instructions, escaped DOM output, citations, consent and provider budgets. |

## Target extension contracts

```text
Authenticated request + owned project
  → acquisition adapter (authorized import / approved connector / unavailable)
  → versioned source snapshot (reference, retrieval, recorded time, missing fields)
  → normalization and validation
  → deterministic analysis / separately consented, evaluated AI
  → immutable review + current draft (transaction)
  → user-approved action → experiment → observed outcomes
```

Future adapters should return typed status (`ready`, `permission_required`, `unavailable`, `rate_limited`, `invalid_source`) and provenance, never substitute a different source silently. Differentiate provider observation time from our ingestion time. No cookie forwarding, login bypass or automatic retries through alternate scrapers after an access denial.

Long-running approved integrations should use jobs with owner/project IDs, idempotency keys, bounded retries, cancellation, failure states and per-provider budgets. Queue payloads should reference private snapshots rather than duplicate source text. Do not provision queues/rendering/inference until the need, permissions and cost limit are established.

## LinkedIn contract and boundary

`POST /api/v1/linkedin/analyze`: session/write key, authorization attestation, strict `/in/` URL, goal (`clients`, `jobs`, `brand`), up to ten target phrases, optional existing owned LinkedIn project, and authorized source text up to 12,000 characters. URL-only requests return 422 without saving a fabricated profile. JSON import accepts six string fields: headline, about, experience, skills, featured, education. Labeled text requires those English labels with colons. Unknown JSON keys and ambiguous introductory text are rejected; this is not a general LinkedIn ZIP/CSV/PDF parser.

Normalized profile JSON exposes missing sections, source format and unverified supplied provenance. The percentage is imported-section coverage only. Guidance changes ordering and outline for the chosen goal; it is not arbitrary natural-language AI assistance. Existing project ownership/export/delete/revision quotas apply, with 20 processing attempts/hour. No extra paid binding is introduced.

[LinkedIn Profile API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api) is restricted to approved developers; [OpenID Connect sign-in](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) provides limited identity claims, not unrestricted full-profile extraction. [Account data download](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data?lang=en) is an authorized user-controlled source, but its archive still needs a separately tested parser. These distinctions remain explicit in the UI.

## Safe implementation sequence

For every addition: contract and threat cases → pure normalization/analysis → owner-scoped persistence → UI with missing/error states → unit and real Worker/D1 tests → disposable browser/live checks → exact-head CI → isolated preview. Add schema migrations rather than mutating historical migration files; test upgrades against representative synthetic data and preserve old report renderers. Keep previous Worker artifact and verify schema compatibility for rollback. No architecture can guarantee zero issues; these controls reduce change risk and make failures diagnosable.

Production gates remain verified identity, anti-abuse, independent security/accessibility checks, measured performance/load/cost, restoration, retention/legal/operator decisions and the explicitly deferred domain. No market validation, scalability capacity or compliance certification is claimed.
