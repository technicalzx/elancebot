# Privacy and preview data handling

Updated 2026-10-13. User-facing notice: [public/privacy.html](public/privacy.html). This describes actual v0.1 behavior, not legal certification.

| Data | Purpose | Lifecycle |
| --- | --- | --- |
| Name/email | Private account; email unverified | Until account deletion |
| Salted scrypt verifier | Password authentication | Replaced on recovery; deleted with account |
| Hashed recovery code | Offline recovery | Rotated on use; deleted with account |
| Hashed sessions | Browser access | 7-day expiry; logout/recovery/deletion revokes |
| Hashed API keys | Scoped integrations | 30-day expiry; manual/recovery/deletion revokes |
| Inputs, URLs, snapshots, reviews | Requested review/history | Until project/account deletion |
| Hashed rate buckets | Abuse limits | Expired rows cleaned on later authentication requests |
| Request/error metadata | Operations/security | Cloudflare account/provider retention settings |

No ads, tracking pixels, email delivery, AI calls, uploads or marketplace connections are enabled. Browser localStorage holds only theme preference; the session cookie is essential. Content is not sold or sent to a model provider.

An approved website operator receives the requested HTTPS fetch and may log it; no user credentials are forwarded. Self-review of the deployment homepage parses rendered HTML locally and labels this source.

Users can edit, export JSON, revoke keys and delete projects/accounts. Live deletion cascades to projects, reviews, sessions and keys. Provider backups and infrastructure logs are not erased by the application and may persist through retention windows. Preview data may be reset; keep exports.

Do not enter sensitive client information, third-party credentials or unnecessary personal data. No MFA, email verification or recovery email is present. Losing both password and recovery code prevents self-service recovery.

Before production, publish a real operator contact, applicable terms, lawful basis and retention schedule; confirm processor agreements, residency and backup retention; establish rights-request and incident procedures. No GDPR, SOC 2 or ISO 27001 certification is claimed. The preview is maintained through [ycgiio/elancebot](https://github.com/ycgiio/elancebot); never post private data in public issues.
