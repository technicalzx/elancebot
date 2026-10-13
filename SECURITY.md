# Security policy

## Supported versions

Security fixes are applied to the latest maintained branch. Before a stable release exists, report issues against `main` and include the commit SHA you tested.

## Reporting a vulnerability

Please do not file public issues for suspected vulnerabilities or include exploitable details in public pull requests. Use GitHub's **Report a vulnerability** / private security advisory flow for this repository. If that option is unavailable, contact a project maintainer privately through the repository's verified owner profile.

Include, where possible:

- a clear description of the issue and affected component;
- reproducible, minimal steps or a proof of concept;
- impact assessment and realistic attack preconditions;
- versions, deployment mode, and relevant configuration (with secrets removed);
- suggested mitigation, if known.

## Handling expectations

Maintainers will acknowledge a good-faith report as soon as practical, investigate it privately, work on a fix, and coordinate disclosure when a patch or mitigation is ready. Timelines depend on severity, reproducibility, and maintainer availability; no response-time guarantee is implied.

## Security boundaries

- Never submit credentials, session cookies, API keys, production data, or personal data in an issue, discussion, or pull request.
- Treat API keys as secrets and store only one-way hashes server-side.
- Use authorized inputs only. A security report is not permission to bypass a third-party service's terms, authentication, or technical controls.
- Reports involving third-party systems should be handled through that system's published security channel when appropriate.

See the [threat model](docs/threat-model.md) and [API & security blueprint](docs/api-security.md) for intended controls.
