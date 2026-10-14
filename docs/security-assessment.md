# Scoped preview security assessment — 2026-10-14

Target: the Elancebot Worker/D1 application, isolated local tests and its named preview with disposable synthetic accounts. Third-party websites, other users, Cloudflare shared infrastructure and production were not penetration-tested. This is an agent-led scoped assessment, not independent VAPT, certification or a guarantee of security.

## Evidence

| Boundary | Check and observed result |
| --- | --- |
| Authentication and sessions | Lifecycle integration verifies secure cookie flags, login/logout, offline recovery rotation, credential revocation and replay denial. Email remains unverified. |
| Object and function authorization | Two-user tests deny cross-owner project/review/result access and mutations. Read keys cannot write; account and key administration are session-only. |
| CSRF and private caching | Cross-site/absent-origin cookie mutations rejected; private API is no-store/noindex. No wildcard CORS. |
| URL/SSRF | Exact approved hosts, HTTPS, no credentials/IP/private hosts/custom ports/query/fragment; redirects, oversized/non-HTML responses and marketplace fetches rejected in isolated tests. No private-network requests were sent. |
| Untrusted page content | Bounded extraction omits script/style/navigation/explicitly hidden content; sources remain data. Browser inspection of a synthetic markup string verifies escaped text, not a created DOM element. |
| AI boundary | Inference disabled. Mock tests verify data/instruction separation, no tool calls, token/time bounds and rejection of invented/malformed evidence citations. Live model behavior remains untested. |
| Quotas and atomicity | Conditional record inserts and atomic rate counters; URL draft/review batch and quota regression preserve the prior input on failure. No sustained live load testing. |
| Privacy and deletion | Account export includes sources, reviews, tool runs and favorites without credential hashes; cascade tests cover all owned tables. Disposable smoke accounts are deleted. |
| Dependencies | `npm audit --audit-level=high`: zero reported vulnerabilities at this verification. This does not prove absence of vulnerabilities. |

Automated evidence: 19 unit tests and four real Worker/D1 integration suites. See [release verification](verification.md) for the exact deployed version and browser/live checks.

## Findings and remediation

- **Data consistency defect, fixed:** URL review quota failure could update input before saving a result. Draft and report now use a transactional D1 batch and a regression checks preservation at 50 revisions.
- **Evidence accuracy defect, fixed:** package/brief words alone were overly broad commercial/process signals. Rules 1.0.1 narrow these checks, with known-example regressions. UI suppresses score deltas when versions or target phrases differ.
- **Hardening gaps, open production gates:** verified identity/MFA, managed anti-abuse, global non-AI load/cost controls, independent review, backup restore, retention jobs, operator/legal notices, access/event auditing and protected releases. No claims of exploitable high-severity findings or CVSS scores are made without evidence.

Expanding to an open-source crawler introduces a new remote-browser/egress boundary. The [acquisition design](public-source-acquisition.md) requires isolated private service access and sandbox/SSRF tests before deployment. Removing internal authentication is not an acceptable way to avoid end-user provider keys.
