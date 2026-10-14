---
name: elancebot-seo
description: Improve and verify Elancebot website and open-source repository discoverability, including metadata, crawl controls, content, structured data, and performance evidence. Use for Elancebot SEO work.
---

# Elancebot SEO

Read the actual public HTML, Worker routes, `docs/requirements-traceability.md` and release gates. The production brand/domain is elancebot.com; the preview is intentionally noindex. The user will connect the domain from another account. Do not remove preview noindex to simulate production launch.

## Verify behavior, not presence alone

Test production-mode canonical, title, description, Open Graph, sitemap URLs, robots, index/noindex headers, valid JSON-LD and HTTP status in an isolated Worker. Verify preview host substitution and noindex separately. Private API/workspace data must never appear in crawlable output, sitemap, shared caches or analytics URLs.

Public landing and tool-guide content must describe capabilities that really work. Add useful original explanations, examples, limitations, accessible headings and internal links; avoid keyword stuffing, doorway pages, fabricated reviews, fake usage figures or unsupported rankings. A sign-in-only tool needs a useful public explanation before it is an SEO landing page.

Use primary current Google Search and schema documentation when changing search-specific behavior. Structured data must match visible content and parse correctly; validation does not promise a rich result.

## Repository discovery

Keep GitHub description, relevant topics, homepage, README quick start, license, contributing/security policies, issue templates, roadmap and working CI accurate. Public screenshots must be synthetic or authorized and free of secrets. Do not generate fake stars, reviews, forks or engagement.

## Measurement and launch

Use the installed web-performance workflow when tracing is available; record real lab conditions and distinguish lab from field results. Do not infer LCP/INP/CLS or Lighthouse scores from bundle size. Keep accessibility, mobile usability and content quality part of the audit.

After domain access is supplied, inspect existing DNS/routes before changing anything. Verify HTTPS, host redirects, canonical, robots, sitemap, noindex removal on intended public pages and private-data protections on the actual custom domain. Search Console ownership/submission needs authorized access; if unavailable, give the exact pending action. Indexing and rankings are external outcomes, never a completion promise.

Report changes, tested URLs/commit, observed results and open dependencies. "SEO ready in source", "deployed", "indexed" and "ranking" are separate statuses.
