---
name: elancebot-vapt
description: Assess and harden Elancebot security using a scoped threat review and reproducible vulnerability tests. Use for requested Elancebot VAPT, authentication/API security review, or security-sensitive changes.
---

# Elancebot security assessment

Read `docs/threat-model.md`, `docs/api-security.md`, `SECURITY.md`, the relevant code and the release gates. Confirm the named target is Elancebot and which environment is authorized. The default test target is isolated local Worker/D1; live tests are limited to the user's preview and disposable accounts.

This skill does not authorize testing LinkedIn, Fiverr, Upwork, other websites submitted to URL analysis, another account, or Cloudflare's shared infrastructure. Do not run broad network scans, credential attacks, sustained load, destructive payloads, real-user data extraction or persistence. Stop on unexpected third-party/private data, uncertain ownership or service degradation and request scope clarification.

## Test actual trust boundaries

- Anonymous/session/read-key/write-key authorization; owner predicates on every data operation.
- Cookie flags, CSRF/Origin, session expiry/revocation, recovery replay and API-key lifecycle.
- Prepared queries, type/size limits, quota atomicity, request amplification and expensive unauthenticated work.
- Stored/reflected XSS and unsafe DOM sinks using inert local test strings, not exfiltration callbacks.
- URL scheme/host normalization, private/IP/marketplace denial, redirects, response size/type/time limits. Mock outbound destinations; never use real metadata or private-network endpoints.
- CORS, cache privacy, CSP, error/log leakage, dependency advisories and accidental secret files.
- Export and deletion completeness for every new table; migration and rollback risks.

Consult current primary OWASP/Cloudflare guidance for changed controls. Record severity with concrete exploit prerequisites and impact, distinguishing confirmed vulnerability, hardening gap, and untested hypothesis. Do not invent CVSS numbers, tool results or certification.

## Remediation and release

Use a minimal reproduction in the isolated integration suite. Implement a targeted fix only when authorized to change the app, then prove the reproduction fails safely and legitimate behavior still works. Include affected paths, test evidence, remaining exposure and release-blocking status.

A dependency audit is not a penetration test. A scoped agent assessment is not an independent full VAPT or proof of legal compliance. Keep unverified identity/MFA, distributed anti-abuse, backup restoration, retention, monitoring and external assessment visible until evidenced.

Security reports in the public repository must omit secrets and exploitable details of unresolved high-impact findings. Use the verified private reporting channel for sensitive evidence.
