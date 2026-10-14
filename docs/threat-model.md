# Threat model

Assets: account access, private content, credentials, operating budget and deployment integrity. Boundaries: browser↔Worker, Worker↔D1, Worker↔approved external host, contributor↔CI↔deployment. External content is data, never executable instructions.

| Threat | Current control | Next step / residual |
| --- | --- | --- |
| Broken object authorization | Owner-qualified queries + cross-user tests | Review every new resource |
| Password/token theft | Salted scrypt, hashed tokens, secure cookies | Managed identity/passkeys/MFA |
| CSRF | SameSite + origin validation | Preserve on new auth routes |
| XSS | Escaped output + restrictive CSP | Automated scans and CSP reporting |
| SQL injection | Bound parameters | Never interpolate user SQL |
| SSRF | Exact allowlist + address/platform blocks; no redirects | Operator public DNS review; egress pinning before expansion |
| Resource exhaustion | Body/time/record quotas + atomic rates | Managed anti-bot, global budgets/load tests |
| Token leakage | Hash-at-rest; no-store; one-time display; query redaction | Review monitoring integrations |
| Prompt injection | Optional AI disabled; adapter treats sources as untrusted, exposes no tools, bounds output and validates evidence quotes | Live adversarial/quality evaluation before enablement; human verification of every generated claim |
| Data loss | Export, isolated environments | Restore drill/retention before production |
| Supply chain | Lockfile, pinned CI actions, read-only CI token | SBOM, secret scan, release attestations |
| Misleading rankings | Versioned heuristic/source limitations | Provider-backed metrics only if authorized |

Residual risk is accepted only for a labeled preview with nonsensitive test content. This is not a penetration test or compliance certificate.
