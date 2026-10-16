# Privacy and preview data handling

Updated 2026-10-14. User-facing notice: [public/privacy.html](public/privacy.html). This describes actual v0.2 behavior, not legal certification.

| Data | Purpose | Lifecycle |
| --- | --- | --- |
| Name/email | Private account; email unverified | Until account deletion |
| Salted scrypt verifier | Password authentication | Replaced on recovery; deleted with account |
| Hashed recovery code | Offline recovery | Rotated on use; deleted with account |
| Hashed sessions | Browser access | 7-day expiry; logout/recovery/deletion revokes |
| Hashed API keys | Scoped integrations | 30-day expiry; manual/recovery/deletion revokes |
| Inputs, URLs, snapshots, reviews | Requested review/history | Until project/account deletion |
| Saved calculator/utility inputs and results | Optional private tool history | Until result/account deletion |
| Favorites and recently opened tool names | Workspace organization | Favorite can be unset; rows removed with account |
| Hashed rate buckets | Abuse limits | Expired rows cleaned on later authentication requests |
| Request/error metadata | Operations/security | Cloudflare account/provider retention settings |

No ads, tracking pixels, email delivery, AI calls, uploads or marketplace connections are enabled. Browser localStorage holds only theme preference; the session cookie is essential. Content is not sold or sent to a model provider.

URL insight reviews store the analyzed own/competitor text, associated URLs, retrieval labels, recorded times, context and results. An imported snapshot is not verified live profile data. The optional Cloudflare Workers AI adapter is disabled; enabling it needs an operator decision, updated deployment notice and live evaluation. If enabled later, users must separately consent on each AI run to sending those snapshots/context for draft generation. No platform credentials are needed or accepted as source content.

An approved website operator receives the requested HTTPS fetch and may log it; no user credentials are forwarded. Self-review of the deployment homepage parses rendered HTML locally and labels this source.

Users can edit, export JSON, revoke keys and delete projects/tool results/accounts. Live account deletion cascades to projects, reviews, tool results, favorites/recent-tool records, sessions and keys. Unsaved calculations are processed without retaining their inputs/results; the recently used tool name is still recorded. Provider backups and infrastructure logs are not erased by the application and may persist through retention windows. Preview data may be reset; keep exports.

Do not enter sensitive client information, third-party credentials or unnecessary personal data. No MFA, email verification or recovery email is present. Losing both password and recovery code prevents self-service recovery.

Before production, publish a real operator contact, applicable terms, lawful basis and retention schedule; confirm processor agreements, residency and backup retention; establish rights-request and incident procedures. No GDPR, SOC 2 or ISO 27001 certification is claimed. The preview is maintained through [technicalzx/elancebot](https://github.com/technicalzx/elancebot); never post private data in public issues.
