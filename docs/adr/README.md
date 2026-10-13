# Architecture decisions

## ADR-001 — Worker + D1

Accepted for the bounded private review loop. Alternative: full framework, external database and managed identity. Chosen to minimize runtime/operations dependencies; heavy work will need queues and further design.

## ADR-002 — Versioned deterministic checks

Accepted over LLM-only scoring. Explainable rules can be tested without model keys, inference costs or unsupported claims. AI drafting may follow with evidence grounding/evaluation; never fabricate proof or rankings.

## ADR-003 — Operator-approved exact URL hosts

Accepted over arbitrary URL fetching. Attestation alone does not address SSRF or collection policy. Preview approves only its own host; self-review parses local rendered HTML. No wildcard/user-controlled allowlist.

## ADR-004 — Local credentials for preview only

Accepted with a production gate. Scrypt, hashed tokens and offline recovery make the slice functional without external credentials. Email unverified; no MFA. Managed OIDC/passkeys and abuse controls must be assessed before production.

## ADR-005 — Embedded static assets

Accepted for the small app: reproducible module deployed through the connected API or Wrangler. Alternative: separate Static Assets upload. Move larger media to native assets/R2 when cache/size needs justify it. User uploads are outside this path.
