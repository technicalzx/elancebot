# SDLC and release gates

Lifecycle: requirements/acceptance → UX/architecture/threat model → bounded implementation → automated/manual verification → isolated preview → explicit production decision → measured operations and incremental improvement.

## Preview evidence

- [x] Versioned schema and separate environments.
- [x] Password/session, ownership and key-scope tests in real Worker/D1 runtime.
- [x] Input bounds, CSRF, URL rejection, recovery revocation and export/delete tests.
- [x] Typecheck, reproducible build, lockfile and dependency audit.
- [x] Record GitHub CI, live smoke and browser verification before handoff; see [verification evidence](verification.md).

## Production gates — pending

- [ ] Verified identity/recovery, MFA/passkey/OIDC decision.
- [ ] Managed anti-abuse, CPU/load tests, signup quotas, budget alerts.
- [ ] Independent security review, secret/dependency review.
- [ ] Screen reader, keyboard, contrast, responsive and automated accessibility assessment.
- [ ] Measured Core Web Vitals/performance budgets; no fabricated Lighthouse score.
- [ ] Operator contact, terms, lawful basis, processors/residency and retention.
- [ ] Backup restore drill, incident runbook and verified private security-report channel.
- [ ] Protected branch/review/deploy environment and least-privilege CI credentials.
- [ ] Domain/zone verification, DNS/TLS, production canonical/robots/sitemap and Search Console owner verification.

## Standards guidance (not certification)

| Reference | Application |
| --- | --- |
| [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Requirements, source protection, verification, vulnerability response |
| [OWASP API Top 10](https://owasp.org/API-Security/editions/2023/en/0x10-api-security-risks/) | Ownership/auth/consumption/SSRF controls and tests |
| [OWASP password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) | Scrypt parameter tradeoff and credential handling |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Semantics, focus, readable responsive UI; formal conformance pending |
| [Google Search Essentials](https://developers.google.com/search/docs/essentials) | Useful crawlable public content, metadata and no spam |

No SOC 2, ISO 27001, GDPR or WCAG certification is claimed. Legal requirements depend on operator, jurisdiction, users and future integrations.
