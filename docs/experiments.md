# Improvement experiments — v0.3

Purpose: connect an evidence review to one intended offer change and manually observed business outcomes. This does not complete automated marketplace acquisition or establish causal uplift.

Open `/experiments.html` from the workspace or a review's **Track outcomes** link. Build a local downloadable plan, then explicitly save it to the signed-in account. Optionally choose an owned project. Saved plans are immutable; create another plan when changing the hypothesis. Reopen from the saved list to enter or correct observations, export JSON, or delete.

## Measurement contract

- Supported proportions: unique qualified inquiries / visits, clicks / impressions, orders / qualified inquiries. Count converting opportunities once; repeated events need another metric, not counts exceeding the denominator.
- Both periods use the planned 7–90 whole days, inclusive ISO dates, ending before today UTC. Follow-up must start after baseline ends. The user records publication date and other influences in notes; timing is not independently verified.
- Counts are integers from 0 to 1 billion. Missing periods remain null. Zero denominators produce unavailable rates, not zero performance. A zero baseline rate has no defined relative uplift.
- Each period retains its source/export description, notes and `user-supplied-unverified` provenance. Different source descriptions generate a comparability warning.
- Display absolute percentage-point difference separately from relative percentage change. No significance, causality, ranking or earnings forecasts are calculated.

## API and privacy

`GET/POST /api/v1/experiments`, `GET/PATCH/DELETE /api/v1/experiments/{id}`. See OpenAPI for fields. Creation accepts plan fields and optional `projectId`. PATCH requires the current integer `version`, `baseline`, and `followUp`; null clears a period. A stale version returns 409 without overwriting input. Plan fields cannot be edited through PATCH.

Read keys can list/read; write keys can mutate. Account export remains session-only and includes experiments. Ownership is checked on every resource and project association. Quotas: 50 experiments/account and 30 creation attempts/hour, in addition to the account API rate limit. Conditional SQL inserts enforce the record limit atomically. Indexed owner queries keep the bounded listing predictable.

Additive migration `0003_experiments.sql` leaves prior data intact. User deletion cascades to all experiments; linked-project deletion also removes its experiments, as disclosed in the form. Export before deletion. Recovery of deleted records through infrastructure backups is not a user-facing undo feature.

## Acceptance and remaining work

Unit and real Worker/D1 tests cover arithmetic, bounds, dates, provenance, scopes, isolation, stale writes, quota, export and cascades. The live smoke script creates and removes its own preview data. UI browser checks are recorded in `verification.md` separately.

Next: authorized structured imports, revision-specific references and an action checklist, after preserving data provenance and privacy. Immutable observation history, automatic scheduling, significance testing, teams and billing are not implemented. Restore drills, verified identity, anti-abuse, independent assessment, performance measurements and operator/domain decisions remain production gates.
