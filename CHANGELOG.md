# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once stable releases begin.

## [Unreleased]

### Added

- Future production identity, anti-abuse and accessibility hardening tracked in the roadmap.

## [0.2.0] - 2026-10-14

### Added

- URL-led own/competitor evidence reviews, source provenance, phrase gaps, prioritized actions and atomic saved-draft revisions; marketplace access fails explicitly without an authorized snapshot.
- Optional consented, quota-bounded Workers AI adapter with exact citation validation and mock tests. Inference is disabled pending an operator decision and live evaluation.
- Categorized directory of 12 working tools, search, favorites and recently opened tools.
- Shared calculator/utility inputs and versioned results with formulas, limitations, recommendations, copy/reset/export, optional save and private history.
- Freelance pricing, profit/margin/markup, gross salary, percentage and weighted GPA calculators; Unicode text/case and unit conversion utilities.
- Owner-scoped tool API, scopes/quotas, additive D1 migration, account export/deletion coverage and workspace search.
- Public tool guide, preview/production SEO integration tests, calculator known-answer tests and expanded negative API tests.
- Full original-requirements traceability plus validated project-specific SDLC, QA, VAPT and SEO skills.

### Fixed

- Unsupported API versions now return 404; documented optional-save API returns both 200 and 201.
- URL insight rules 1.0.1 no longer count a package/brief mention alone as commercial/delivery evidence; score comparisons require identical rules and target phrases.
- URL draft/report writes are transactional and quota rejection preserves the previous draft.

- Desktop workspace grid placement and mobile navigation visibility, focus trapping and Escape handling.
- Content-versioned styles/scripts and revalidated HTML to avoid stale assets after deployment.
- Website `robots: none` handling, with tests for bounded HTML, redirects, content types and self-review provenance.

### Changed

- Explicit preview dry-run builds and asset generation before remote development.
- Recorded live preview verification and production limitations.

## [0.1.0] - 2026-10-13

### Added

- Working profile, gig, service, competitor-snapshot and constrained website metadata reviews.
- Private accounts with scrypt, secure sessions and single-use offline recovery.
- Saved projects, revision history, search, JSON export and account/project deletion.
- Scoped, expiring and revocable API keys with public OpenAPI 3.1 documentation.
- Responsive light/dark workspace and public landing page.
- D1 schema, separate preview/production configuration, CI, tests, threat model and SDLC documentation.
- Public Cloudflare preview with noindex; production/domain activation remains gated.
