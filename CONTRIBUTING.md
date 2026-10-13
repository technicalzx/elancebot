# Contributing to Elancebot

Thanks for helping make Elancebot useful, trustworthy, and maintainable. By contributing, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md) and license your contribution under Apache-2.0.

## Before you start

- Search existing issues and discussions before opening a new one.
- For significant features, start with an issue or short proposal describing the user problem, data-source authorization, security/privacy impact, and test plan.
- Do not propose scraping, CAPTCHA bypassing, credential sharing, unauthorized API use, fabricated marketplace signals, or guaranteed ranking outcomes.
- Never include secrets, customer data, personal data, or live access tokens in commits, test fixtures, issues, or screenshots.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install locked dependencies with `npm ci` and use the scripts listed by `npm run`.
3. Add or update tests with the behavior change.
4. Run `npm run check`, `npm run typecheck`, `npm test`, `npm run test:integration`, and `npm audit`.
5. Update user-facing documentation, API descriptions, migrations, and changelog notes where relevant.
6. Open a pull request using the provided template.

Keep changes small and reviewable. Explain the problem, solution, risks, rollout/rollback plan, and validation evidence. Add screenshots for visible UI changes and examples for API changes.

## Engineering expectations

- Prefer explicit, observable behavior over opaque scoring or unsupported claims.
- Enforce authorization server-side; client-side checks are a usability enhancement, not a boundary.
- Validate and normalize all external input. Use parameterized queries and avoid logging secrets.
- Design data features around minimization, consent, deletion, and source provenance.
- Preserve backward compatibility or document a migration and deprecation path.
- Keep accessibility and responsive behavior in scope for UI work.

## Commit and review guidance

Use clear, imperative commit subjects (for example, `Add API-key rotation endpoint`). A pull request should pass CI, receive an appropriate review, and resolve relevant security/privacy questions before merge. Maintainers may request changes, split a broad change, or decline a contribution that conflicts with the product principles.

## Reporting issues

Use the issue templates for reproducible bugs and well-scoped feature requests. For security vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
